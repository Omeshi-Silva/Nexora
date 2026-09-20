export default function Logo({ size }) {
  return (
    <img
      className="brand__mark"
      src="/nexora-logo.png"
      alt=""
      aria-hidden="true"
      style={size ? { height: size } : undefined}
    />
  );
}
