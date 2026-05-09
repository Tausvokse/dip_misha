import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/api/axios.instance";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [make, setMake] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  useEffect(() => {
    void loadProfileData();
  }, []);

  async function loadProfileData() {
    try {
      const { data } = await api.get("/profile");
      if (data.profile) {
        setFirstName(data.profile.firstName || "");
        setLastName(data.profile.lastName || "");
        setMiddleName(data.profile.middleName || "");
        setPhone(data.profile.phone || "");
      }
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error("Failed to load profile data", error);
    }
  }

  async function saveProfile() {
    setIsSavingProfile(true);
    try {
      await api.put("/profile", { firstName, lastName, middleName, phone });
      await restoreSession(); // Оновлюємо дані в сторі
      alert("Профіль успішно оновлено!");
    } catch (error) {
      alert("Помилка при збереженні профілю");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function addVehicle() {
    if (!make || !licensePlate) return;
    setIsAddingVehicle(true);
    try {
      await api.post("/profile/vehicles", { 
        make, 
        licensePlate, 
        isDefault: vehicles.length === 0 
      });
      setMake("");
      setLicensePlate("");
      await loadProfileData();
    } catch (error) {
      alert("Помилка при додаванні авто");
    } finally {
      setIsAddingVehicle(false);
    }
  }

  async function deleteVehicle(id: string) {
    if (!confirm("Видалити цей автомобіль?")) return;
    try {
      await api.delete(`/profile/vehicles/${id}`);
      await loadProfileData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Помилка при видаленні авто");
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-xl bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-bold text-slate-950">Особисті дані</h1>
          <p className="mt-2 text-slate-500 mb-6">{user?.email}</p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Прізвище</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Іванов" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Ім'я</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Іван" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">По-батькові</label>
              <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Іванович" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Номер телефону</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380..." />
            </div>
          </div>
          <Button className="mt-6" onClick={saveProfile} disabled={isSavingProfile}>
            {isSavingProfile ? "Збереження..." : "Зберегти зміни"}
          </Button>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-950 mb-4">Мій Автопарк</h2>
          <div className="mb-6 space-y-3">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-bold">{v.make}</p>
                  <p className="text-sm text-slate-500">{v.licensePlate}</p>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteVehicle(v.id)}>
                  Видалити
                </Button>
              </div>
            ))}
            {vehicles.length === 0 && <p className="text-sm text-slate-500">Ви ще не додали жодного авто.</p>}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-md font-bold mb-3">Додати автомобіль</h3>
            <div className="grid gap-3 md:grid-cols-2 mb-3">
              <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Марка (напр. VW Passat)" />
              <Input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="Номерний знак" />
            </div>
            <Button onClick={addVehicle} disabled={isAddingVehicle || !make || !licensePlate}>
              {isAddingVehicle ? "Додаємо..." : "Додати в автопарк"}
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}