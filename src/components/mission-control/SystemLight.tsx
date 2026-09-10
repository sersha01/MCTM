interface SystemLightProps {
  state: "ok" | "warn" | "down";
}

const lightClass: Record<SystemLightProps["state"], string> = {
  ok: "light-ok",
  warn: "light-warn",
  down: "light-down",
};

export function SystemLight({ state }: SystemLightProps) {
  return <span aria-hidden="true" className={`light ${lightClass[state]}`} />;
}
