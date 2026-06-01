#!/usr/bin/env python3
"""
Register DeepSeek (OpenAI-compatible) as graphify LLM backend and run semantic corpus extraction.

Upstream graphify.llm BACKENDS only define claude + kimi; we inject "deepseek" at runtime.

Usage (from repo root):
  ./scripts/graphify_semantic_deepseek.py              # frontend + backend corpus
  ./scripts/graphify_semantic_deepseek.py --test       # single tiny request, cheap

If graphify-out/.graphify_detect.json exists (e.g. after a scoped detect), it is used as the file list.
Do not run `graphify update .` on the whole repo after building a scoped graph — it re-scan the entire tree and overwrites graph.json.

Requires: pip install graphifyy openai
Env:      DEEPSEEK_API_KEY in .env.local or environment (see env.graphify.example)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
GRAPHIFY_OUT = REPO_ROOT / "graphify-out"


def load_local_env() -> None:
    for name in (".env.local", ".env"):
        p = REPO_ROOT / name
        if not p.is_file():
            continue
        for raw in p.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key, val = key.strip(), val.strip().strip('"').strip("'")
            os.environ[key] = val


def register_deepseek_backend() -> None:
    import graphify.llm as llm_module

    # Official OpenAI-compat base (no /v1); SDK merges /chat/completions.
    base = os.environ.get("GRAPHIFY_DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
    model = os.environ.get("GRAPHIFY_DEEPSEEK_MODEL", "deepseek-v4-flash")
    llm_module.BACKENDS["deepseek"] = {
        "base_url": base,
        "default_model": model,
        "env_key": "DEEPSEEK_API_KEY",
        "pricing": {"input": 0.0, "output": 0.0},
        "temperature": 0,
    }


def merged_detect_frontend_backend() -> dict:
    """Prefer graphify-out/.graphify_detect.json when present (orchestrator may filter paths)."""

    canned = GRAPHIFY_OUT / ".graphify_detect.json"
    if canned.is_file():
        return json.loads(canned.read_text(encoding="utf-8"))

    from graphify.detect import detect

    root = REPO_ROOT
    fe = detect(root / "frontend")
    be = detect(root / "backend")

    def merge_files(key: str) -> list[str]:
        a = fe.get("files", {}).get(key, []) or []
        b = be.get("files", {}).get(key, []) or []
        return sorted(set(a + b))

    code_paths = merge_files("code")
    filtered_code: list[str] = []
    for p in code_paths:
        s = p.replace("\\", "/")
        if "/backend/bin/" in s:
            continue
        if s.endswith("/gradlew") or s.endswith("gradlew.bat"):
            continue
        filtered_code.append(p)

    merged = {
        "files": {
            "code": filtered_code,
            "document": merge_files("document"),
            "paper": merge_files("paper"),
            "image": merge_files("image"),
            "video": merge_files("video"),
        }
    }
    merged["total_files"] = sum(len(v) for v in merged["files"].values())
    merged["total_words"] = fe.get("total_words", 0) + be.get("total_words", 0)
    merged["skipped_sensitive"] = (fe.get("skipped_sensitive") or []) + (
        be.get("skipped_sensitive") or []
    )
    return merged


def all_paths_from_detect(detect_result: dict) -> list[Path]:
    paths: list[Path] = []
    for lst in detect_result["files"].values():
        paths.extend(Path(p) for p in lst)
    return paths


def run_semantic(paths: list[Path]) -> dict:
    from graphify.llm import extract_corpus_parallel

    return extract_corpus_parallel(
        paths,
        backend="deepseek",
        root=REPO_ROOT,
        token_budget=60_000,
        max_concurrency=2,
    )


def smoke_test() -> None:
    from graphify.llm import extract_files_direct

    sample = REPO_ROOT / "frontend" / "src" / "lib" / "config.ts"
    if not sample.is_file():
        sample = REPO_ROOT / "frontend" / "src" / "api" / "http.ts"
    if not sample.is_file():
        print("No sample file for smoke test", file=sys.stderr)
        sys.exit(1)
    register_deepseek_backend()
    print(f"Smoke test extracting: {sample.relative_to(REPO_ROOT)} …")
    out = extract_files_direct([sample], backend="deepseek", root=REPO_ROOT)
    nodes, edges = len(out.get("nodes", [])), len(out.get("edges", []))
    print(f"OK — {nodes} nodes, {edges} edges, tokens in/out: {out.get('input_tokens')}/{out.get('output_tokens')}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="cheap connectivity + JSON sanity check")
    args = parser.parse_args()

    load_local_env()

    if not os.environ.get("DEEPSEEK_API_KEY"):
        print(
            "Missing DEEPSEEK_API_KEY. Add it to .env.local (see env.graphify.example).",
            file=sys.stderr,
        )
        sys.exit(1)

    register_deepseek_backend()

    if args.test:
        smoke_test()
        return

    GRAPHIFY_OUT.mkdir(parents=True, exist_ok=True)
    merged = merged_detect_frontend_backend()
    GRAPHIFY_OUT.joinpath(".graphify_detect_cache.json").write_text(
        json.dumps(merged, indent=2), encoding="utf-8"
    )
    paths = all_paths_from_detect(merged)
    print(f"Semantic extraction (deepseek): {len(paths)} files …")
    sem = run_semantic(paths)
    GRAPHIFY_OUT.joinpath(".graphify_semantic.json").write_text(
        json.dumps(
            {
                "nodes": sem.get("nodes", []),
                "edges": sem.get("edges", []),
                "hyperedges": sem.get("hyperedges", []),
                "input_tokens": sem.get("input_tokens", 0),
                "output_tokens": sem.get("output_tokens", 0),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(
        f"Wrote graphify-out/.graphify_semantic.json "
        f"({len(sem.get('nodes', []))} nodes, {len(sem.get('edges', []))} edges, "
        f"{sem.get('input_tokens', 0)} in / {sem.get('output_tokens', 0)} out tokens)"
    )


if __name__ == "__main__":
    main()
