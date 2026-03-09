import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

_backend_dir = str(Path(__file__).parent.parent)
_python_dir = str(Path(__file__).parent.parent.parent / 'python')
if _backend_dir in sys.path:
    sys.path.remove(_backend_dir)
sys.path.insert(0, _backend_dir)
if _python_dir not in sys.path:
    sys.path.append(_python_dir)

from services import job_runner as job_runner_module


class _FakeStdout:
    def __init__(self, lines):
        self._lines = list(lines)

    def readline(self):
        if self._lines:
            return self._lines.pop(0)
        return ''


class _FakeProcess:
    def __init__(self, lines, return_code=0):
        self.stdout = _FakeStdout(lines)
        self._return_code = return_code
        self.terminated = False

    def poll(self):
        if self.terminated:
            return self._return_code
        return None if self.stdout._lines else self._return_code

    def wait(self):
        return self._return_code

    def terminate(self):
        self.terminated = True


def _build_runner(tmp_path, monkeypatch):
    monkeypatch.setattr(job_runner_module, 'JOB_LOG_DIR', str(tmp_path))
    return job_runner_module.JobRunner()


@pytest.mark.parametrize(
    ('payload', 'expected'),
    [
        ({'command': 'backtest', 'start_date': '2026-01-01', 'end_date': '2026-01-31', 'tickers': 'AAA,BBB', 'no_charts': True}, ['main.py', '--mode', 'backtest', '--start', '2026-01-01', '--end', '2026-01-31', '--tickers', 'AAA,BBB', '--no-charts']),
        ({'command': 'stage2', 'with_fundamentals': True}, ['main.py', '--mode', 'stage2', '--with-fundamentals']),
        ({'command': 'full'}, ['main.py', '--mode', 'full']),
        ({'command': 'chart', 'ticker': 'AAA', 'start_date': '2026-01-01', 'end_date': '2026-01-31'}, ['main.py', '--mode', 'chart', '--ticker', 'AAA', '--start', '2026-01-01', '--end', '2026-01-31']),
        ({'command': 'update_tickers', 'min_market_cap': 1000, 'max_tickers': 25}, ['scripts/update_tickers_extended.py', '--min-market-cap', '1000', '--max-tickers', '25']),
    ],
)
def test_build_command_supports_expected_payloads(tmp_path, monkeypatch, payload, expected):
    runner = _build_runner(tmp_path, monkeypatch)

    assert runner._build_command(payload) == expected


def test_build_command_requires_chart_ticker(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)

    with pytest.raises(ValueError, match='ticker is required'):
        runner._build_command({'command': 'chart'})


def test_build_command_rejects_unknown_command(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)

    with pytest.raises(ValueError, match='Unsupported command'):
        runner._build_command({'command': 'unknown'})


def test_shell_preview_prefixes_python_executable(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)

    preview = runner._shell_preview(['main.py', '--mode', 'full'])

    assert 'main.py --mode full' in preview
    assert job_runner_module.sys.executable in preview


def test_run_job_marks_success_and_writes_logs(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)
    process = _FakeProcess(['first line\n', 'second line\n'])
    monkeypatch.setattr(job_runner_module.subprocess, 'Popen', lambda *args, **kwargs: process)

    job_id = 'job-success'
    log_path = tmp_path / 'job-success.log'
    runner._jobs[job_id] = {
        'job_id': job_id,
        'status': 'queued',
        'started_at': None,
        'finished_at': None,
        'return_code': None,
        'error': None,
        'cancel_requested': False,
        'log_path': str(log_path),
    }

    runner._run_job(job_id, ['main.py', '--mode', 'full'], 60, str(log_path))

    assert runner._jobs[job_id]['status'] == 'succeeded'
    assert runner._jobs[job_id]['return_code'] == 0
    assert 'first line' in log_path.read_text(encoding='utf-8')


def test_cancel_job_flags_running_job(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)
    runner._jobs['job-1'] = {
        'job_id': 'job-1',
        'status': 'running',
        'created_at': 'now',
        'cancel_requested': False,
    }

    cancelled = runner.cancel_job('job-1')

    assert cancelled['cancel_requested'] is True
    assert runner._jobs['job-1']['cancel_requested'] is True


def test_get_job_logs_returns_tail(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)
    log_path = tmp_path / 'job-logs.log'
    log_path.write_text('a\n b\n c\n', encoding='utf-8')
    runner._jobs['job-logs'] = {
        'job_id': 'job-logs',
        'status': 'running',
        'log_path': str(log_path),
    }

    payload = runner.get_job_logs('job-logs', tail=2)

    assert payload['lines'] == [' b', ' c']


def test_get_job_logs_returns_empty_when_file_missing(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)
    runner._jobs['job-empty'] = {
        'job_id': 'job-empty',
        'status': 'queued',
        'log_path': str(tmp_path / 'missing.log'),
    }

    payload = runner.get_job_logs('job-empty', tail=5)

    assert payload == {'job_id': 'job-empty', 'status': 'queued', 'lines': []}


def test_run_job_marks_failure_when_subprocess_crashes(tmp_path, monkeypatch):
    runner = _build_runner(tmp_path, monkeypatch)

    def raise_oserror(*_args, **_kwargs):
        raise OSError('spawn failed')

    monkeypatch.setattr(job_runner_module.subprocess, 'Popen', raise_oserror)

    job_id = 'job-failed'
    log_path = tmp_path / 'job-failed.log'
    runner._jobs[job_id] = {
        'job_id': job_id,
        'status': 'queued',
        'started_at': None,
        'finished_at': None,
        'return_code': None,
        'error': None,
        'cancel_requested': False,
        'log_path': str(log_path),
    }

    runner._run_job(job_id, ['main.py', '--mode', 'full'], 60, str(log_path))

    assert runner._jobs[job_id]['status'] == 'failed'
    assert runner._jobs[job_id]['error'] == 'spawn failed'
