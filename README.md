# Triangular Mesh Smoothing

ブラウザ上で三角形メッシュと Uniform Laplacian Smoothing を試せる教材用の静的 Web アプリです。Canvas 上で頂点を追加・ドラッグし、三角形分割とスムージング結果を観察できます。

## Features

- クリックで頂点を追加
- 頂点ドラッグでメッシュを変形
- 追加・移動された頂点から三角形分割を自動更新
- Uniform Laplacian Smoothing を 1 ステップずつ実行
- `lambda` スライダーでスムージング強度を調整
- 境界頂点固定のオン・オフ
- 反復回数、頂点数、三角形数、処理時間を表示

## Local Development

Node.js 20 以上を推奨します。

```bash
npm install
npm run dev
```

開発サーバーが表示した URL をブラウザで開いてください。

## Build

```bash
npm run build
```

`dist/` に静的ファイルが生成されます。

```bash
npm run preview
```

ビルド済みファイルをローカルで確認します。

## GitHub Pages

このプロジェクトは `vite.config.ts` で `base: "./"` を設定しているため、リポジトリ名に依存せず GitHub Pages へ配置しやすい構成です。

1. GitHub のリポジトリ設定で Pages を有効化します。
2. GitHub Actions などで `npm ci` と `npm run build` を実行します。
3. 生成された `dist/` を Pages の公開対象としてデプロイします。

手動で確認する場合は、`npm run build` 後に `dist/` の内容を任意の静的ホスティングへ配置してください。

## Project Structure

```text
src/
  app.ts              UI state and event handling
  canvasRenderer.ts   Canvas drawing and hit testing
  geometry.ts         Geometry helpers and boundary detection
  smoothing.ts        Uniform Laplacian Smoothing
  triangulation.ts    Bowyer-Watson triangulation
  types.ts            Shared TypeScript types
```
