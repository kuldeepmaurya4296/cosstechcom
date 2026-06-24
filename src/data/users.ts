// Data collection: users (customers + staff)
export interface UserAddress {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  default: boolean;
}
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | "vendor";
  joinedAt: string;
  orders: number;
  totalSpent: number;
  addresses: UserAddress[];
  avatar?: string;
}

export const currentUser: User = {
  id: "u1",
  name: "Aarav Sharma",
  email: "aarav@example.com",
  phone: "+91 98200 12345",
  role: "customer",
  joinedAt: "2024-08-12",
  orders: 6,
  totalSpent: 1842,
  addresses: [
    {
      id: "a1",
      label: "Home",
      line1: "12 Marine Drive, Apt 4B",
      city: "Mumbai",
      state: "MH",
      zip: "400020",
      country: "India",
      default: true,
    },
    {
      id: "a2",
      label: "Office",
      line1: "Bandra Kurla Complex, Tower C",
      city: "Mumbai",
      state: "MH",
      zip: "400051",
      country: "India",
      default: false,
    },
  ],
};

export const customers: User[] = [
  currentUser,
  {
    id: "u2",
    name: "Priya Mehta",
    email: "priya@example.com",
    phone: "+91 90000 11111",
    role: "customer",
    joinedAt: "2024-03-04",
    orders: 12,
    totalSpent: 3120,
    addresses: [],
  },
  {
    id: "u3",
    name: "Karan Singh",
    email: "karan@example.com",
    phone: "+91 90000 22222",
    role: "customer",
    joinedAt: "2025-01-21",
    orders: 3,
    totalSpent: 890,
    addresses: [],
  },
  {
    id: "u4",
    name: "Neha Kapoor",
    email: "neha@example.com",
    phone: "+91 90000 33333",
    role: "customer",
    joinedAt: "2025-02-09",
    orders: 8,
    totalSpent: 2240,
    addresses: [],
  },
  {
    id: "u5",
    name: "Rohan Verma",
    email: "rohan@example.com",
    phone: "+91 90000 44444",
    role: "customer",
    joinedAt: "2024-11-30",
    orders: 5,
    totalSpent: 1430,
    addresses: [],
  },
  {
    id: "u6",
    name: "Sara Iyer",
    email: "sara@example.com",
    phone: "+91 90000 55555",
    role: "customer",
    joinedAt: "2025-04-15",
    orders: 2,
    totalSpent: 540,
    addresses: [],
  },
  {
    id: "u7",
    name: "Vikram Joshi",
    email: "vikram@example.com",
    phone: "+91 90000 66666",
    role: "customer",
    joinedAt: "2024-07-19",
    orders: 14,
    totalSpent: 4280,
    addresses: [],
  },
  {
    id: "u8",
    name: "Anjali Rao",
    email: "anjali@example.com",
    phone: "+91 90000 77777",
    role: "customer",
    joinedAt: "2025-03-08",
    orders: 4,
    totalSpent: 1180,
    addresses: [],
  },
];
