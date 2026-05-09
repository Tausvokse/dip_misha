import { useEffect, useState } from "react";
import { CreditCard, History, Plus, Trash2, ShieldCheck, Wallet, ArrowUpRight } from "lucide-react";
import { getPaymentHistory } from "@/api/payment.api";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import type { Reservation } from "@/types/parking.types";
import { Button } from "@/components/ui/Button";
import { api } from "@/api/axios.instance";
import { Spinner } from "@/components/ui/Spinner";

export function PaymentsPage() {
  const [payments, setPayments] = useState<Array<{ id: string; amount: number; paidAt: string | null; reservation: Reservation }>>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [historyRes, methodsRes] = await Promise.all([
        getPaymentHistory(),
        api.get("/profile/payment-methods")
      ]);
      setPayments(historyRes.data.payments || []);
      setPaymentMethods(methodsRes.data.paymentMethods || []);
    } catch (error) {
      console.error("Failed to load payment data", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addMockPaymentMethod(type: "CARD") {
    try {
      const payload = { type, label: "Visa Premium", brand: "VISA", last4: "8844", isDefault: paymentMethods.length === 0 };

      await api.post("/profile/payment-methods", payload);
      await loadData();
    } catch (error) {
      alert("Помилка при додаванні способу оплати");
    }
  }

  async function deleteMethod(id: string) {
    if (!confirm("Ви впевнені, що хочете видалити цей спосіб оплати?")) return;
    try {
      await api.delete(`/profile/payment-methods/${id}`);
      await loadData();
    } catch (error) {
      alert("Помилка при видаленні");
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Гаманець та оплати</h1>
          <p className="text-slate-500 mt-1">Керуйте своїми картками та переглядайте історію транзакцій.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Payment Methods */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Мої картки
                </h2>
                <Button variant="outline" size="sm" onClick={() => addMockPaymentMethod("CARD")} className="gap-2">
                  <Plus className="h-4 w-4" /> Додати
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white shadow-xl transition-transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                      <button 
                        onClick={() => deleteMethod(method.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-full text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{method.label}</p>
                      <p className="text-xl font-mono font-bold tracking-[0.2em]">
                        {method.last4 ? `•••• •••• •••• ${method.last4}` : method.type}
                      </p>
                    </div>

                    {method.isDefault && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                        Default
                      </div>
                    )}
                    
                    <div className="absolute -bottom-4 -right-4 opacity-10">
                      <CreditCard className="h-24 w-24" />
                    </div>
                  </div>
                ))}
                
                {paymentMethods.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <Wallet className="h-10 w-10 mb-3 opacity-20" />
                    <p className="font-medium">Немає збережених карток</p>
                  </div>
                )}
              </div>
            </section>

            {/* History */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-blue-600" />
                Останні транзакції
              </h2>
              <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-slate-100">
                <div className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Бронювання місця {payment.reservation.spot?.number ?? "#"}</p>
                          <p className="text-xs text-slate-500">{formatDate(payment.paidAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Оплачено</p>
                      </div>
                    </div>
                  ))}
                  
                  {payments.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p>Історія транзакцій порожня</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
              <h3 className="text-lg font-bold mb-4 opacity-90">Баланс витрат</h3>
              <p className="text-4xl font-black mb-1">
                {formatCurrency(payments.reduce((acc, p) => acc + p.amount, 0))}
              </p>
              <p className="text-sm opacity-70">Загальна сума за весь час</p>
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex justify-between text-sm">
                  <span>Транзакцій</span>
                  <span className="font-bold">{payments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}