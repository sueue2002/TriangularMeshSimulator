# Repository Guidelines


## Agent working rules

- 今後のユーザーとの対話は、日本語をメインに行う。コード、コマンド、エラーメッセージ、固有名詞は必要に応じて英語のまま扱う。
- 既存の内容は、明示的な指示がない限り削除・大幅変更しない。
- ファイルを作成・変更する前に、変更予定の要約を提示する。
- 可能な場合は、変更差分を提示してから承認を求める。
- 関係ないファイルは変更しない。
- 大きな設計変更を勝手に行わない。
- コマンド実行前に、目的と実行するコマンドを説明する。
- ネットワークアクセス、依存追加、削除操作、プロジェクト外への書き込みは必ず確認する。
- 秘密情報、APIキー、認証情報を作成・変更・表示しない。
- 作業後は、変更したファイル、実行したコマンド、確認結果、残る懸念点を要約する。

## Git workflow

- 作業開始前に `git status` を確認する。
- 変更前に作業方針を説明する。
- 変更後に `git status` と `git diff` を確認し、変更内容を要約する。
- ユーザーの明示的な承認なしに `git add`、`git commit`、`git push` を実行しない。
- コミットする場合は、コミットメッセージ案を提示してから承認を得る。
- `AGENTS.md` を変更する場合は、必ず事前に変更理由と差分案を提示し、ユーザーの明示的な承認を得る。

## Ambiguous task workflow

- タスクが曖昧な場合、すぐに実装しない。
- まず目的、前提、制約、不明点を整理する。
- 必要ならユーザーに質問する。
- 実装前に、作成・変更予定ファイル、実装ステップ、検証方法を提示する。
- ユーザーの明示的な承認があるまでファイルを変更しない。
- 実装は承認された範囲に限定し、最小差分で行う。

## Prompt and task files

- 長文の作業指示は、CLIに直接入力せず `prompts/` 配下の Markdown ファイルに書く。
- 一時的な調査メモやエラー記録は `notes/` 配下に置く。
- `AGENTS.md` には恒久的なルールだけを書く。
- 一回限りのタスク内容を `AGENTS.md` に混ぜない。


## Project Structure & Module Organization

This repository is currently minimal. The only top-level project directory is `prompts/`, which is reserved for prompt drafts, review notes, and related Markdown artifacts. As implementation files are added, keep the structure predictable:

- `src/` for application or simulation source code.
- `tests/` for automated tests that mirror `src/` module names.
- `assets/` for meshes, images, sample data, or other static inputs.
- `docs/` for longer design notes that do not belong in this contributor guide.

Keep generated output, caches, and local experiment files out of version control unless they are required fixtures.

## Build, Test, and Development Commands

No build system or package manifest is present yet. Add commands to this section when tooling is introduced, and prefer standard entry points such as:

- `npm test`, `pytest`, or `cargo test` for the full test suite.
- `npm run build`, `make build`, or equivalent for production builds.
- `npm run dev` or a documented executable for local development.

When adding a new toolchain, include its setup command in the project README and keep commands runnable from the repository root.

## Coding Style & Naming Conventions

Use small, cohesive modules with descriptive names. Prefer lowercase directory names and language-standard file naming, such as `mesh_solver.py`, `mesh-solver.ts`, or `mesh_solver.cpp`, depending on the selected stack. Use Markdown headings consistently in prompt and documentation files. Keep lines reasonably short and avoid committing editor-specific formatting changes.

Once a formatter or linter is adopted, document it here and run it before submitting changes.

## Testing Guidelines

Place tests in `tests/` and name them after the behavior or module under test, for example `test_mesh_solver.py` or `mesh-solver.test.ts`. Include focused unit tests for geometry calculations and regression tests for known mesh edge cases. If fixtures are needed, store small deterministic examples under `tests/fixtures/`.

## Commit & Pull Request Guidelines

This repository does not yet expose a commit history pattern. Use concise, imperative commit messages such as `Add mesh validation tests` or `Document prompt workflow`. Pull requests should include a short summary, testing performed, linked issues when applicable, and screenshots or rendered outputs for visual changes.

## Agent-Specific Instructions

Before editing, inspect the current tree and avoid overwriting unrelated local changes. Keep changes narrowly scoped to the requested task, and update this guide when project tooling or structure changes.
