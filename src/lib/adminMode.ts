// URLに ?admin=1 を付けたときだけ管理者限定機能を表示するための判定。
// 通常のチーム共有URLではfalseになり、API課金が発生する機能は一切表示されない。
// 今後の練習案内AI等でも同じ考え方（管理者限定機能をURLフラグで出し分け）を使う想定。
export function isAdminMode(): boolean {
  return new URLSearchParams(window.location.search).get("admin") === "1";
}
