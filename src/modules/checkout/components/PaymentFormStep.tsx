import { Input } from "@/components/shared/Input";

export function PaymentFormStep() {
  const methods = ["Credit / Debit card", "UPI", "Cash on delivery"];
  return (
    <>
      <h2 className="font-serif text-xl font-bold">Payment</h2>
      <div className="space-y-2">
        {methods.map((m, i) => (
          <label
            key={m}
            className="flex items-center gap-3 border border-border rounded-lg p-4 cursor-pointer hover:border-primary transition"
          >
            <input type="radio" name="pay" defaultChecked={i === 0} />
            <span className="font-semibold text-sm">{m}</span>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Input label="Card number" defaultValue="**** **** **** 4242" wide />
        <Input label="Expiry" defaultValue="04/28" />
        <Input label="CVC" defaultValue="•••" />
      </div>
    </>
  );
}
