import { TokyoWavesLogo } from "../brand/TokyoWavesLogo";

type Destination =
  | "tournament"
  | "instagram-ai"
  | "scout"
  | "expedition-guide";

const SERVICES: {
  id: Destination;
  number: string;
  name: string;
  eyebrow: string;
  description: string;
  action: string;
  accent: string;
  icon: "media" | "sns" | "scout" | "expedition";
}[] = [
  {
    id: "scout",
    number: "01",
    name: "Scout",
    eyebrow: "ささえる",
    description: "試合を観ながらチームと選手の気づきを残し、コーチ全員で共有する。",
    action: "分析をはじめる",
    accent: "#0e9f76",
    icon: "scout",
  },
  {
    id: "expedition-guide",
    number: "02",
    name: "遠征Guide",
    eyebrow: "まとめる",
    description: "遠征情報から、LINE・メール・印刷用の案内をまとめてつくる。",
    action: "遠征要項をつくる",
    accent: "#ef8a22",
    icon: "expedition",
  },
  {
    id: "tournament",
    number: "03",
    name: "Media Factory",
    eyebrow: "つくる",
    description: "大会資料から投稿画像をつくる。スタンプやキャラクターの制作もここから。",
    action: "制作をはじめる",
    accent: "#2254f4",
    icon: "media",
  },
  {
    id: "instagram-ai",
    number: "04",
    name: "SNS Agent",
    eyebrow: "とどける",
    description: "ブランドを理解したAIと、次のInstagram投稿を考え、育てる。",
    action: "投稿を考える",
    accent: "#ef3f72",
    icon: "sns",
  },
];

function ServiceIcon({ type }: { type: "media" | "sns" | "scout" | "expedition" }) {
  if (type === "media") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="9" width="34" height="30" rx="4" />
        <path d="m12 33 8-9 6 6 5-5 5 8M15 17h.01" />
      </svg>
    );
  }
  if (type === "sns") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 31V17a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H21l-8 6v-6a5 5 0 0 1-3-5Z" />
        <path d="M17 24h14M17 19h8M17 29h10" />
      </svg>
    );
  }
  if (type === "scout") return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="21" cy="21" r="11" />
      <path d="m29 29 10 10M21 15v12M15 21h12" />
    </svg>
  );
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 16h24v24H12zM18 16v-4h12v4M12 26h24M22 26v4h4v-4" />
    </svg>
  );
}

export function TokyoWavesHome() {
  const handleOpen = (destination: Destination) => {
    if (destination === "scout") {
      window.location.assign("https://tokyowaves-scout.vercel.app/");
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("tool", destination);
    window.location.assign(url);
  };

  return (
    <div className="tw-home">
      <div className="tw-home__glow tw-home__glow--one" />
      <div className="tw-home__glow tw-home__glow--two" />

      <header className="tw-home__header">
        <TokyoWavesLogo className="tw-home__logo" scale={0.82} />
        <p>TEAM OPERATIONS</p>
      </header>

      <main className="tw-home__main">
        <section className="tw-home__hero">
          <p className="tw-home__kicker">TOKYO WAVES · TEAM HUB</p>
          <h1>
            東京WAVESの活動を、
            <br />
            <span>ここから。</span>
          </h1>
          <p className="tw-home__lead">
            制作、発信、遠征準備。東京WAVESの活動を支えるツールを、
            <br className="hidden sm:block" />
            ここから始められます。
          </p>
        </section>

        <section className="tw-home__services" aria-label="サービスを選ぶ">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              type="button"
              className="tw-service-card"
              style={{ "--service-accent": service.accent } as React.CSSProperties}
              onClick={() => handleOpen(service.id)}
            >
              <span className="tw-service-card__number">{service.number}</span>
              <span className="tw-service-card__icon">
                <ServiceIcon type={service.icon} />
              </span>
              <span className="tw-service-card__eyebrow">{service.eyebrow}</span>
              <strong>{service.name}</strong>
              <span className="tw-service-card__description">{service.description}</span>
              <span className="tw-service-card__action">
                {service.action}
                <span aria-hidden="true">→</span>
              </span>
            </button>
          ))}
        </section>
      </main>

      <footer className="tw-home__footer">
        <span>ONE TEAM, ONE WAVE.</span>
        <span>© TOKYO WAVES</span>
      </footer>
    </div>
  );
}
