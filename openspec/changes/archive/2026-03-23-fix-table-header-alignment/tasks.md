## 1. Spec And Design

- [x] 1.1 补充表头对齐与表头背景色的 change artifacts，明确 delimiter row 对齐语义必须同时作用于表头和数据行

## 2. Implementation

- [x] 2.1 修改结构化表格渲染层，将 `table.alignments` 应用于 `th` / `td`，并显式覆盖浏览器默认 `th` 居中行为
- [x] 2.2 为表头增加极淡的主题感知背景色，分别覆盖 light / dark 主题

## 3. Automated Verification

- [x] 3.1 补充回归测试，覆盖表头对齐跟随 delimiter row
- [x] 3.2 补充回归测试，覆盖表头在 light / dark 主题下都有淡背景色

## 4. Manual Verification

- [x] 4.1 手工验证：`| :--- | :---: | ---: |` 下三列表头分别左对齐、居中、右对齐
- [x] 4.2 手工验证：light 主题下表头有极淡背景色，且不抢 active cell 视觉
- [x] 4.3 手工验证：dark 主题下表头有极淡背景色，且不抢 active cell 视觉
