from __future__ import annotations

import re
from pathlib import Path

from doc_gardening import expected_managed_files

LINK_PATTERN = re.compile(r'\[[^\]]+\]\(([^)]+)\)')
REQUIRED_FILES = [
    'README.md',
    'ARCHITECTURE.md',
    'COMMAND.md',
    'docs/DOCUMENTATION_SYSTEM.md',
    'docs/QUALITY_SCORE.md',
    'docs/design-docs/index.md',
    'docs/product-specs/index.md',
    'docs/generated/doc-inventory.md',
    '.github/workflows/ci.yml',
    '.github/workflows/docs-governance.yml',
]


def markdown_files(repo_root: Path) -> list[Path]:
    docs_files = sorted((repo_root / 'docs').rglob('*.md')) if (repo_root / 'docs').exists() else []
    root_files = [repo_root / name for name in ('README.md', 'ARCHITECTURE.md', 'COMMAND.md') if (repo_root / name).exists()]
    return root_files + docs_files


def resolve_link(source_path: Path, link_target: str) -> Path | None:
    if link_target.startswith(('http://', 'https://', 'mailto:')):
        return None
    clean_target = link_target.split('#', 1)[0]
    if not clean_target:
        return None
    return (source_path.parent / clean_target).resolve()


def find_broken_internal_links(repo_root: Path) -> list[str]:
    errors: list[str] = []
    for path in markdown_files(repo_root):
        text = path.read_text(encoding='utf-8')
        for match in LINK_PATTERN.finditer(text):
            target = resolve_link(path, match.group(1))
            if target is None:
                continue
            if not target.exists():
                relative_path = path.relative_to(repo_root).as_posix()
                errors.append(
                    f'Broken internal link in {relative_path}: {match.group(1)}'
                )
    return errors


def find_missing_required_files(repo_root: Path) -> list[str]:
    errors: list[str] = []
    for relative in REQUIRED_FILES:
        if not (repo_root / relative).exists():
            errors.append(f'Missing required documentation file: {relative}')
    return errors


def find_stale_managed_files(repo_root: Path) -> list[str]:
    errors: list[str] = []
    for path, expected_content in expected_managed_files(repo_root).items():
        if not path.exists():
            errors.append(f'Managed documentation file is missing: {path.relative_to(repo_root).as_posix()}')
            continue
        actual_content = path.read_text(encoding='utf-8')
        if actual_content != expected_content:
            errors.append(
                f'Managed documentation file is stale: {path.relative_to(repo_root).as_posix()}. Run python scripts/doc_gardening.py'
            )
    return errors


def run_checks(repo_root: Path) -> list[str]:
    errors: list[str] = []
    errors.extend(find_missing_required_files(repo_root))
    errors.extend(find_broken_internal_links(repo_root))
    errors.extend(find_stale_managed_files(repo_root))
    return errors


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    errors = run_checks(repo_root)
    if errors:
        print('Documentation integrity check failed:')
        for error in errors:
            print(f'- {error}')
        return 1
    print('Documentation integrity check passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
