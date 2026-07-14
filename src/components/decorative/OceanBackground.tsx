export function OceanBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 大きなぼかし光（奥行きの主役） */}
      <div
        className="absolute left-1/2 top-[-120px] h-[900px] w-[1300px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(59,130,246,0.18), transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      {/* 小さな光（アクセント） */}
      <div
        className="absolute -right-20 bottom-24 h-[260px] w-[260px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,224,102,0.1), transparent 70%)",
        }}
      />
    </div>
  );
}
