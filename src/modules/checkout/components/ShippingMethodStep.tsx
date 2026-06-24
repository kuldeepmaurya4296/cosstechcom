export function ShippingMethodStep() {
  const methods = [
    { name: "Standard", desc: "5–7 days", price: "Free" },
    { name: "Express", desc: "2–3 days", price: "₹399" },
    { name: "Same-day (Jawa Rewa)", desc: "Today", price: "₹699" },
  ];

  return (
    <>
      <h2 className="font-serif text-xl font-bold">Shipping method</h2>
      <div className="space-y-2">
        {methods.map(({ name, desc, price }) => (
          <label
            key={name}
            className="flex items-center justify-between border border-border rounded-lg p-4 cursor-pointer hover:border-primary transition"
          >
            <div className="flex items-center gap-3">
              <input type="radio" name="ship" defaultChecked={name === "Standard"} />
              <div>
                <div className="font-semibold text-sm">{name}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
            <span className="font-semibold">{price}</span>
          </label>
        ))}
      </div>
    </>
  );
}
