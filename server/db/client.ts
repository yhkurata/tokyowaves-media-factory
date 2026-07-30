import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema.js";

// 遅延初期化にしている理由：Viteのdevプラグインは import 時点
// （vite.config.tsのトップレベルimportがモジュールを評価するタイミング）で
// このファイルも評価されるが、process.env.DATABASE_URL は vite.config.ts の
// loadEnv() 呼び出しの後でしか確定しない。トップレベルで Pool を作ると
// connectionString が undefined のまま固定されてしまうため、実際にDBへ
// アクセスする最初のリクエスト時（＝env確定後）に初期化する。
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

// 通常のDBクライアントと、トランザクション内で渡される tx を同じ引数として
// 受け取れる関数を書くための型。書き込み関数はこの型を受け取れば、単独実行にも
// トランザクション内実行にも両対応できる(tx側は $client プロパティを持たないため
// 単純な ReturnType だけでは型が合わず、union にする必要がある)。
type BaseDb = ReturnType<typeof drizzle<typeof schema>>;
export type DbOrTx = BaseDb | Parameters<Parameters<BaseDb["transaction"]>[0]>[0];

export function getDb() {
  if (!dbInstance) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    // Vercelのランタイムに、インスタンスがサスペンドされる前にアイドル接続を
    // 破棄する猶予を与える（Vercel環境外では無害）。
    attachDatabasePool(pool);
    dbInstance = drizzle({ client: pool, schema });
  }
  return dbInstance;
}
