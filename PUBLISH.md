# CrossOne 发布指南

本文用于发布 **CrossOne 框架 npm 包**，不是部署 `crossone-app` 业务应用。脚本默认只生成本地产物，不登录 npm、不上传包，不提交代码、不创建 Git tag，也不会自动更改仓库中的包版本或锁文件。

## 发布范围与格式

按以下依赖顺序发布，四个包使用同一个显式版本号：

1. `@crossone/requirement`
2. `@crossone/skill-requirement`
3. `@crossone/template-default`
4. `@crossone/cli`

根工作区、`@crossone/docs`、`crossone-app`、测试和发布工具本身不会被打包。包名沿用仓库现状；发布账号必须有 `@crossone` scope 的发布权限。脚本不会重命名包或创建 npm 组织。

当前框架是 Bun-only：发布包保留 `src/**/*.ts` 源码及现有 exports，CLI 保留 `#!/usr/bin/env bun`，并设置可执行权限。消费端需要 **Bun >= 1.3.0**；这不是面向 Node.js 的编译产物，不附带独立 `.d.ts`。内部包的 `workspace:*` 仅在暂存清单中替换为本次精确版本，第三方依赖保持原值。生成应用的源码中仍然保留它自己的 `workspace:*`，不会进行全局字符串替换。

工作区清单中的 `private: true` 和 `0.0.0` 保持不变；只有四个白名单包的发布暂存清单移除 private 并写入发布版本。不要在仓库根目录直接执行 `npm publish`，也不要绕过脚本发布原始工作区。

仓库目前未声明统一许可证。脚本只继承包已有的 license，不擅自指定许可证；如存在 `LICENSE`、`LICENSE.md` 或 `LICENSE.txt`，会优先复制包内文件，否则复制根目录同名文件。对外发布前请由维护者确认许可信息，并按需要补充相关文件。

## 环境准备

需要 Bun、Node.js/npm、Git；检查当前环境：

```sh
bun --version
node --version
npm --version
bun install --frozen-lockfile
bun run release:check
```

`release:check` 对框架运行类型检查和 `bun test packages`，不要求示例应用安装依赖。准备正式版本时，还应运行可选的完整生成应用验证（会安装已发布的第三方依赖并启动本地服务）：

```sh
bun packages/template-default/scripts/verify-generated.ts --all-clients
bun packages/template-default/scripts/verify-generated.ts --api-only
```

小程序与原生 App 的构建验证是生成平台工程，不等于平台 IDE 编译或真机验收。

## 先预演

```sh
# 稳定版默认 tag 为 latest
bun run release --version 0.1.0 --dry-run

# 预发布版默认 tag 为 next
bun run release --version 0.2.0-beta.1 --dry-run

# 可指定其他非版本号 tag
bun run release --version 0.2.0-beta.1 --tag beta --dry-run
```

省略 `--dry-run` 仍然只生成本地产物。版本必须是 `x.y.z` 或 `x.y.z-prerelease`，不支持 `v` 前缀、build metadata、数字标识符前导零；预发布版本不能使用 `latest` tag。

每次生成独立目录，终端打印 `RELEASE_DIR=<绝对路径>`：

```text
packages/cli/dist/releases/<version>-<随机后缀>/
  packages/        四个经过处理的包目录
  tarballs/       npm pack 生成的四个 .tgz
  release.json    版本、tag、registry、顺序和 tarball 相对路径
```

目录受 Git 忽略；重复预演不会覆盖旧目录。失败时保留当次暂存内容供排查，之前成功的产物不受影响。预演使用离线 `npm pack` 并禁用生命周期脚本，不执行 `npm publish`。预演本身不自动运行测试，测试请使用 `release:check`。

检查 `release.json`、清单依赖与 tarball 文件列表，确认不存在密钥、测试、示例业务代码以及未解析的 workspace 依赖。例如把输出中的目录替换到下方：

```sh
tar -tzf /absolute/release-dir/tarballs/crossone-cli-0.1.0.tgz
```

建议在仓库外的全新目录中，将四个 tarball 同时安装并验收 CLI，避免误用工作区符号链接：

```sh
mkdir crossone-release-smoke
cd crossone-release-smoke
bun init -y
bun add /absolute/release-dir/tarballs/crossone-requirement-0.1.0.tgz /absolute/release-dir/tarballs/crossone-skill-requirement-0.1.0.tgz /absolute/release-dir/tarballs/crossone-template-default-0.1.0.tgz /absolute/release-dir/tarballs/crossone-cli-0.1.0.tgz
./node_modules/.bin/crossone init demo --clients client-web-phone,client-mini-weixin
cd demo
../node_modules/.bin/crossone requirement create orders
```

## 正式发布

**以下命令会上传 npm 包并可能更新 dist-tag，不属于预演。** 本次新增脚本和文档不代表已经执行发布。

先确认 scope 权限和认证配置，使用官方 registry：

```sh
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
git status --short
```

使用已审查、无未提交或未跟踪文件的 checkout。示例应用若不打算提交，应自行明确配置忽略；脚本不会替你忽略或删除工作文件。不要把 npm token 写入仓库、脚本、发布产物或命令行；按 npm 当前认证流程配置登录、发布权限及 2FA。

```sh
bun run release --version 0.1.0 --publish --yes

# 预发布
bun run release --version 0.2.0-beta.1 --tag next --publish --yes
```

仅当同时提供 `--publish --yes` 才会上传，且不能同时指定 `--dry-run`。正式命令重新生成一组产物，并在首次上传前检查：

- Git 工作区干净；
- 框架类型检查和测试通过；
- `npm whoami` 成功；
- 四个包的目标版本均未发布。只有明确的 E404 被视为不存在；网络、认证等其他错误会中止。

之后按依赖顺序上传，显式指定 `--access public`、tag 和 `https://registry.npmjs.org/`，禁用发布生命周期脚本。任何包发布失败都会停止后续上传，不会吞掉错误或假装全部成功。

注意：脚本没有替换 scope 的参数，没有跳过检查的正式发布模式，也不会主动回滚 npm 或写 Git。发布版本清单保存在产物的 `release.json`，请在团队发布记录中记录版本和对应 Git commit。

## 发布后验证与失败恢复

```sh
npm view @crossone/cli@0.1.0 version dependencies bin --json
npm view @crossone/template-default@0.1.0 dependencies --json
bunx --bun @crossone/cli@0.1.0 init my-app --yes
```

在生成的应用中安装依赖，验证需要的端、API 和需求工作流。正式发布后的 registry 安装验证、scope 所有权、认证及真机验收，不应由离线测试结果代替。

多包发布不是原子操作：已上传的包不会因为后续失败而自动撤回。npm 的同名同版本不能重复发布。若发生部分成功，先核对日志和 `npm view`，修复认证、权限或网络问题；使用**同一次成功打包目录中的 tarball**手动补发尚未发布的包，保持依赖顺序、版本、registry 和 tag 一致。例如：

```sh
npm publish /absolute/release-dir/tarballs/crossone-cli-0.1.0.tgz --ignore-scripts --access public --tag latest --registry https://registry.npmjs.org/
```

不要重新打包修改后的源码并混入同一发布版本。若需要改代码，选择新版本并重新完整预演。若发布后发现缺陷，优先修复后发布新版本；不要依赖自动 unpublish。脚本不会自动更改已有 dist-tag 或进行恢复操作。

参考：[npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/)、[npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/)。
