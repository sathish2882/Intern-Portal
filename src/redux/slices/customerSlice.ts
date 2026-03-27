import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Customer, CustomerState } from "../../types";

const mockCustomers: Customer[] = [
  { id: 1, name: "Arjun Sharma", email: "arjun@example.com", phone: "+91 98765 43210", plan: "Pro", status: "Active" },
  { id: 2, name: "Priya Menon", email: "priya@example.com", phone: "+91 87654 32109", plan: "Basic", status: "Active" },
  { id: 3, name: "Rahul Verma", email: "rahul@example.com", phone: "+91 76543 21098", plan: "Enterprise", status: "Pending" },
  { id: 4, name: "Sneha Patel", email: "sneha@example.com", phone: "+91 65432 10987", plan: "Basic", status: "Inactive" },
  { id: 5, name: "Karthik R", email: "karthik@example.com", phone: "+91 54321 09876", plan: "Pro", status: "Active" },
];

interface AddCustomerPayload extends Omit<Customer, "id"> {}

const initialState: CustomerState = {
  customers: mockCustomers,
};

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    addCustomer: (state, action: PayloadAction<AddCustomerPayload>) => {
      const newId =
        state.customers.length > 0
          ? Math.max(...state.customers.map((customer) => customer.id)) + 1
          : 1;

      state.customers.push({
        id: newId,
        ...action.payload,
      });
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const customerIndex = state.customers.findIndex(
        (customer) => customer.id === action.payload.id,
      );

      if (customerIndex !== -1) {
        state.customers[customerIndex] = action.payload;
      }
    },
    deleteCustomer: (state, action: PayloadAction<number>) => {
      state.customers = state.customers.filter(
        (customer) => customer.id !== action.payload,
      );
    },
  },
});

export const { addCustomer, updateCustomer, deleteCustomer } =
  customerSlice.actions;

export default customerSlice.reducer;
