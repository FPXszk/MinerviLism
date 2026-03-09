from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from check_docs import run_checks
from doc_gardening import build_index_entries_markdown, synchronize_docs


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def create_doc_repo(root: Path) -> None:
    write_text(
        root / "docs" / "design-docs" / "index.md",
        """# design-docs

<!-- BEGIN AUTO-GENERATED DOC LIST -->
stale
<!-- END AUTO-GENERATED DOC LIST -->
""",
    )
    write_text(
        root / "docs" / "product-specs" / "index.md",
        """# product-specs

<!-- BEGIN AUTO-GENERATED DOC LIST -->
stale
<!-- END AUTO-GENERATED DOC LIST -->
""",
    )
    write_text(root / "docs" / "design-docs" / "strategy.md", "# Strategy\n\n設計判断の説明。\n")
    write_text(root / "docs" / "product-specs" / "dashboard.md", "# Dashboard Spec\n\n期待動作の説明。\n")
    write_text(root / "ARCHITECTURE.md", "# ARCHITECTURE\n\n[Documentation System](docs/DOCUMENTATION_SYSTEM.md)\n")
    write_text(root / "README.md", "# README\n\n[Architecture](ARCHITECTURE.md)\n")
    write_text(root / "COMMAND.md", "# COMMAND\n")
    write_text(root / "docs" / "QUALITY_SCORE.md", "# QUALITY_SCORE\n")
    write_text(root / ".github" / "workflows" / "ci.yml", "name: ci\n")


def test_build_index_entries_markdown_lists_files_with_links(tmp_path: Path) -> None:
    create_doc_repo(tmp_path)

    entries = build_index_entries_markdown(
        tmp_path / "docs" / "design-docs",
        tmp_path,
    )

    assert "- [strategy.md](strategy.md) — Strategy" in entries


def test_synchronize_docs_refreshes_indexes_and_inventory(tmp_path: Path) -> None:
    create_doc_repo(tmp_path)

    changed = synchronize_docs(tmp_path)

    design_index = (tmp_path / "docs" / "design-docs" / "index.md").read_text(encoding="utf-8")
    product_index = (tmp_path / "docs" / "product-specs" / "index.md").read_text(encoding="utf-8")
    inventory = (tmp_path / "docs" / "generated" / "doc-inventory.md").read_text(encoding="utf-8")

    assert tmp_path / "docs" / "generated" / "doc-inventory.md" in changed
    assert "- [strategy.md](strategy.md) — Strategy" in design_index
    assert "- [dashboard.md](dashboard.md) — Dashboard Spec" in product_index
    assert "Documentation inventory" in inventory
    assert "ARCHITECTURE.md" in inventory


def test_run_checks_reports_stale_generated_docs_and_broken_links(tmp_path: Path) -> None:
    create_doc_repo(tmp_path)
    synchronize_docs(tmp_path)

    write_text(tmp_path / "docs" / "generated" / "doc-inventory.md", "stale\n")
    write_text(tmp_path / "README.md", "# README\n\n[Broken](docs/missing.md)\n")

    errors = run_checks(tmp_path)

    assert any("doc-inventory" in error for error in errors)
    assert any("Broken internal link" in error for error in errors)
