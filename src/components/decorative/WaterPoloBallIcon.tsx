type Props = {
  className?: string;
};

export function WaterPoloBallIcon({ className }: Props) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="4" />
      <path d="M50,4 A46,58 0 0,1 50,96" stroke="white" strokeWidth="3" />
      <path d="M6,36 A70,46 0 0,0 94,36" stroke="white" strokeWidth="3" />
      <path d="M6,64 A70,46 0 0,1 94,64" stroke="white" strokeWidth="3" />
    </svg>
  );
}
