import { Input } from "@/components/shared/Input";

export function AddressFormStep() {
  return (
    <>
      <h2 className="font-serif text-xl font-bold">Shipping address</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Full name" defaultValue="Aarav Sharma" />
        <Input label="Phone" defaultValue="+91 98200 12345" />
        <Input label="Address line 1" defaultValue="12 Marine Drive, Apt 4B" wide />
        <Input label="City" defaultValue="Mumbai" />
        <Input label="State" defaultValue="Maharashtra" />
        <Input label="ZIP" defaultValue="400020" />
      </div>
    </>
  );
}
