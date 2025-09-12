import { useState, useEffect } from "react";
import api from "../api";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/solid";
import AlertNotification from "./AlertNotification";

export default function ExpenseManagement() {
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [netAvailableBalance, setNetAvailableBalance] = useState(0);
  const [alert, setAlert] = useState<any>(null);
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const fetchExpenses = async () => {
    try {
      const response = await api.get("/api/expenses");
      setMonthlyExpenses(response.data.monthlyExpenses);
      setNetAvailableBalance(
        parseFloat(response.data.netAvailableBalance || "0")
      );
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message: "Failed to fetch expense data.",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/expenses", { item, quantity, price, description });
      setAlert({
        show: true,
        type: "success",
        message: "Expense added successfully!",
      });
      fetchExpenses();
      setItem("");
      setQuantity("1");
      setPrice("");
      setDescription("");
    } catch (error: any) {
      setAlert({
        show: true,
        type: "error",
        message: error.response?.data?.message || "Failed to add expense.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string | number) =>
    `₹${parseFloat(String(val) || "0").toLocaleString("en-IN")}`;
  const inputStyle =
    "w-full p-2 rounded bg-[#1f2628] h-11 text-white border border-gray-700 focus:outline-none focus:border-[#c69909]";

  return (
    <>
      {alert?.show && (
        <AlertNotification {...alert} onClose={() => setAlert(null)} />
      )}
      <div className="bg-[#111315] p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#c69909]">
            Expense Management
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Net Available Balance</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(netAvailableBalance)}
            </p>
          </div>
        </div>

        <form onSubmit={handleAddExpense} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_3fr_auto] gap-4 items-end">
            <div>
              <label className="text-sm font-bold text-gray-300 mb-1 block">
                Item Name*
              </label>
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-300 mb-1 block">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                  }
                }}
                className={inputStyle}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-300 mb-1 block">
                Total Price*
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                  }
                }}
                className={inputStyle}
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-300 mb-1 block">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g., For the month of August"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-11 flex items-center justify-center gap-2 bg-[#c69909] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 disabled:opacity-50"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{loading ? "Adding..." : "Add"}</span>
            </button>
          </div>
        </form>

        <div className="w-full space-y-2">
          {monthlyExpenses.map((monthData) => (
            <Disclosure
              key={monthData.month_year}
              as="div"
              className="bg-[#1f2628] rounded-lg"
            >
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 text-left text-lg font-medium text-white hover:bg-gray-700/50 focus:outline-none rounded-lg">
                    <span>
                      {new Date(monthData.month_year + "-02").toLocaleString(
                        "default",
                        { month: "long", year: "numeric" }
                      )}
                    </span>
                    <div className="flex items-center gap-4 text-sm font-semibold">
                      <span className="text-red-400">
                          Total Expenses: {formatCurrency(monthData.total_expenses)}
                      </span>
                      <ChevronDownIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-[#c69909] transition-transform`} />
                    </div>
                  </Disclosure.Button>

                  <Transition
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 -translate-y-4"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-4"
                  >
                    <Disclosure.Panel className="px-2 pb-2 text-sm text-gray-500">
                      <div className="bg-[#111315] p-2 rounded-md">
                        <table className="w-full text-left">
                          <thead className="border-b border-gray-700 text-gray-400">
                            <tr>
                              <th className="p-2">Date</th>
                              <th className="p-2">Item</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Description</th>
                              <th className="p-2 text-right">Price</th>
                              <th className="p-2">Added By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {monthData.transactions.map((tx: any) => (
                              <tr key={tx.id}>
                                <td className="p-2 text-white">
                                  {new Date(
                                    tx.created_date
                                  ).toLocaleDateString()}
                                </td>
                                <td className="p-2 text-white font-semibold">
                                  {tx.item}
                                </td>
                                <td className="p-2 text-white">
                                  {tx.quantity}
                                </td>
                                <td className="p-2 text-gray-300">
                                  {tx.description}
                                </td>
                                <td className="p-2 text-white text-right">
                                  {formatCurrency(tx.price)}
                                </td>
                                <td className="p-2 text-gray-300">
                                  {tx.added_by}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </>
  );
}
