from __future__ import annotations

import sys
from pathlib import Path

FILE_PATH = Path(__file__).resolve()
BACKEND_DIR = FILE_PATH.parents[1]
REPO_ROOT = FILE_PATH.parents[2]
for path_entry in (str(REPO_ROOT), str(BACKEND_DIR)):
    if path_entry not in sys.path:
        sys.path.insert(0, path_entry)

from backend.app import app


DEFAULT_OUTPUT_PATH = REPO_ROOT / "frontend" / "src" / "api" / "generated" / "contracts.ts"


def _primitive_type(schema_type: str) -> str:
    return {
        "boolean": "boolean",
        "integer": "number",
        "number": "number",
        "string": "string",
        "null": "null",
    }.get(schema_type, "unknown")


def _render_schema(schema: dict) -> str:
    if "$ref" in schema:
        return schema["$ref"].split("/")[-1]

    if "enum" in schema:
        return " | ".join(repr(value).replace("'", '"') for value in schema["enum"])

    if "anyOf" in schema:
        return " | ".join(_render_schema(option) for option in schema["anyOf"])

    if "oneOf" in schema:
        return " | ".join(_render_schema(option) for option in schema["oneOf"])

    if "allOf" in schema:
        return " & ".join(_render_schema(option) for option in schema["allOf"])

    schema_type = schema.get("type")
    if schema_type == "array":
        return f"Array<{_render_schema(schema.get('items', {}))}>"

    if schema_type == "object" or "properties" in schema:
        properties = schema.get("properties", {})
        required = set(schema.get("required", []))
        if not properties:
            additional = schema.get("additionalProperties")
            if isinstance(additional, dict):
                return f"Record<string, {_render_schema(additional)}>"
            return "Record<string, unknown>"

        lines = ["{"]
        for key, value in properties.items():
            optional_flag = "" if key in required else "?"
            lines.append(f"  {key}{optional_flag}: {_render_schema(value)};")
        lines.append("}")
        return "\n".join(lines)

    if schema_type:
        return _primitive_type(schema_type)

    additional = schema.get("additionalProperties")
    if isinstance(additional, dict):
        return f"Record<string, {_render_schema(additional)}>"
    if additional is True:
        return "Record<string, unknown>"

    return "unknown"


def export_contracts(output_path: Path = DEFAULT_OUTPUT_PATH) -> None:
    openapi_schema = app.openapi()
    schemas = openapi_schema.get("components", {}).get("schemas", {})

    output_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "/* eslint-disable */",
        "// Auto-generated from FastAPI OpenAPI schema.",
        "",
    ]
    for name in sorted(schemas):
        lines.append(f"export type {name} = {_render_schema(schemas[name])}")
        lines.append("")

    output_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


if __name__ == "__main__":
    export_contracts()
