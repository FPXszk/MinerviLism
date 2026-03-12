set shell := ["bash", "-cu"]

dev:
  ./devinit.sh

stop:
  tmux kill-session -t minervilism

logs:
  tail -F backend.log frontend.log

test:
  ./python/.venv/bin/python3 -m pytest

lint:
  ./python/.venv/bin/python3 -m ruff check python

fmt:
  ./python/.venv/bin/python3 -m ruff format python
