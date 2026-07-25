import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Modal } from '../components/Modal';
import { PageLoader } from '../components/Loader';
import { toast } from '../components/Toast';
import { biometricApi, employeeApi } from '../api/services';
import useFormValidation from '../hooks/useFormValidation';
import { pattern, required, ValidationRules } from '../utils/validation';
import {
  Fingerprint,
  Plus,
  RefreshCw,
  Wifi,
  Trash2,
  Pencil,
  AlertCircle,
  Link2,
} from 'lucide-react';

interface DeviceValues {
  name: string;
  serialNumber: string;
  deviceType: string;
  ipAddress: string;
  port: string;
  commKey: string;
  location: string;
}

const emptyDevice: DeviceValues = {
  name: '',
  serialNumber: '',
  deviceType: 'ZKTECO',
  ipAddress: '',
  port: '4370',
  commKey: '0',
  location: '',
};

const BiometricDevices: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);
  const [unmapped, setUnmapped] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [punches, setPunches] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [mappingFor, setMappingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [deviceRes, employeeRes, punchRes] = await Promise.all([
        biometricApi.getDevices(),
        employeeApi.getAll({ limit: 200, status: 'ACTIVE' }),
        biometricApi.getPunches({ limit: 25 }),
      ]);

      setDevices(deviceRes.data.data.devices || []);
      setUnmapped(deviceRes.data.data.unmappedEnrollments || []);
      setEmployees(employeeRes.data.data.employees || employeeRes.data.data.users || []);
      setPunches(punchRes.data.data.punches || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not load device data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rules = useMemo<ValidationRules<DeviceValues>>(
    () => ({
      name: [required('Device name')],
      serialNumber: [required('Serial number')],
      ipAddress: [
        pattern(/^(\d{1,3}\.){3}\d{1,3}$/, 'Enter a valid IP like 192.168.1.201'),
      ],
      port: [required('Port'), pattern(/^\d{2,5}$/, 'Port must be a number')],
    }),
    []
  );

  const form = useFormValidation<DeviceValues>({
    initialValues: emptyDevice,
    rules,
    onSubmit: async (values) => {
      const payload = {
        ...values,
        port: Number(values.port),
        commKey: Number(values.commKey || 0),
      };

      try {
        if (editing) {
          await biometricApi.updateDevice(editing.id, payload);
          toast.success('Device updated');
        } else {
          await biometricApi.createDevice(payload);
          toast.success('Device added');
        }
        setModalOpen(false);
        setEditing(null);
        load();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Could not save the device');
      }
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyDevice);
    setModalOpen(true);
  };

  const openEdit = (device: any) => {
    setEditing(device);
    form.reset({
      name: device.name || '',
      serialNumber: device.serialNumber || '',
      deviceType: device.deviceType || 'ZKTECO',
      ipAddress: device.ipAddress || '',
      port: String(device.port ?? 4370),
      commKey: String(device.commKey ?? 0),
      location: device.location || '',
    });
    setModalOpen(true);
  };

  const runAction = async (id: string, action: 'test' | 'sync') => {
    setBusyId(id);
    try {
      const response =
        action === 'test' ? await biometricApi.testDevice(id) : await biometricApi.syncDevice(id);

      if (response.data.success) toast.success(response.data.message);
      else toast.error(response.data.message);

      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Device did not respond');
    } finally {
      setBusyId(null);
    }
  };

  const removeDevice = async (device: any) => {
    if (!window.confirm(`Remove ${device.name}? Punches already imported stay on the attendance sheet.`)) {
      return;
    }

    try {
      await biometricApi.deleteDevice(device.id);
      toast.success('Device removed');
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not remove the device');
    }
  };

  const assign = async (userId: string, biometricId: string) => {
    try {
      const response = await biometricApi.mapEmployee(userId, biometricId || null);
      toast.success(response.data.message);
      setMappingFor(null);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not save the mapping');
    }
  };

  const error = (field: keyof DeviceValues) =>
    form.touched[field] && form.errors[field] ? form.errors[field] : '';

  const inputClass = (field: keyof DeviceValues) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:ring-2 ${
      error(field)
        ? 'border-red-400 bg-red-50 focus:ring-red-200'
        : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
    }`;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fingerprint devices</h1>
          <p className="text-sm text-slate-500">
            Punches from these machines land on the same attendance sheet as web check-ins.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const res = await biometricApi.syncAll();
                toast.success(res.data.message);
                load();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Sync failed');
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Sync all
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add device
          </button>
        </div>
      </div>

      {unmapped.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              {unmapped.length} enrollment number{unmapped.length > 1 ? 's are' : ' is'} not linked to an employee
            </p>
            <p className="mt-1 text-amber-800">
              Punches from {unmapped.map((item) => item.biometricUserId).join(', ')} are on hold. Map them below and
              the missing days fill in automatically.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {devices.map((device) => (
          <Card key={device.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                  <Fingerprint className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{device.name}</p>
                  <p className="text-xs text-slate-500">
                    {device.deviceType} · SN {device.serialNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {device.ipAddress ? `${device.ipAddress}:${device.port}` : 'Push mode (device dials in)'}
                    {device.location ? ` · ${device.location}` : ''}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  device.status === 'ONLINE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : device.status === 'DISABLED'
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {device.status}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {device.lastSyncAt
                ? `Last sync ${new Date(device.lastSyncAt).toLocaleString('en-IN')}`
                : 'Never synced'}
              {device.lastSyncMessage ? ` — ${device.lastSyncMessage}` : ''}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => runAction(device.id, 'test')}
                disabled={busyId === device.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Wifi className="h-3.5 w-3.5" />
                Test
              </button>
              <button
                onClick={() => runAction(device.id, 'sync')}
                disabled={busyId === device.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${busyId === device.id ? 'animate-spin' : ''}`} />
                Sync now
              </button>
              <button
                onClick={() => openEdit(device)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => removeDevice(device)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </Card>
        ))}

        {devices.length === 0 && (
          <Card className="md:col-span-2 text-center">
            <Fingerprint className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-900">No devices yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your fingerprint machine to start importing punches automatically.
            </p>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee to device mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500">
            The enrollment number is the ID shown on the machine when the employee registers their finger.
          </p>

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{employee.fullName}</p>
                  <p className="text-xs text-slate-500">{employee.employeeCode}</p>
                </div>

                {mappingFor === employee.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.target as HTMLFormElement).elements.namedItem(
                        'biometricId'
                      ) as HTMLInputElement;
                      assign(employee.id, input.value.trim());
                    }}
                    className="flex shrink-0 items-center gap-2"
                  >
                    <input
                      name="biometricId"
                      autoFocus
                      defaultValue={employee.biometricId || ''}
                      placeholder="e.g. 14"
                      className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setMappingFor(null)}
                      className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setMappingFor(employee.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {employee.biometricId ? `ID ${employee.biometricId}` : 'Link device ID'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent device punches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Time</th>
                  <th className="pb-2 pr-4 font-medium">Employee</th>
                  <th className="pb-2 pr-4 font-medium">Device ID</th>
                  <th className="pb-2 pr-4 font-medium">Source</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {punches.map((punch) => (
                  <tr key={punch.id}>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-slate-700">
                      {new Date(punch.punchTime).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-900">
                      {punch.user ? punch.user.fullName : <span className="text-amber-600">Not mapped</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">{punch.biometricUserId}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{punch.device?.name}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          punch.processed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {punch.processed ? 'Applied' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {punches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                      No punches imported yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit device' : 'Add fingerprint device'}
      >
        <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Device name</label>
            <input
              placeholder="Main gate terminal"
              className={inputClass('name')}
              {...form.fieldProps('name')}
            />
            {error('name') && <p className="mt-1 text-xs text-red-600">{error('name')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Serial number</label>
              <input
                placeholder="From the back of the machine"
                className={inputClass('serialNumber')}
                {...form.fieldProps('serialNumber')}
              />
              {error('serialNumber') && (
                <p className="mt-1 text-xs text-red-600">{error('serialNumber')}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
              <select className={inputClass('deviceType')} {...form.fieldProps('deviceType')}>
                <option value="ZKTECO">ZKTeco</option>
                <option value="ESSL">eSSL</option>
                <option value="REALTIME">Realtime</option>
                <option value="MANTRA">Mantra</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                IP address <span className="font-normal text-slate-400">— leave blank for push mode</span>
              </label>
              <input placeholder="192.168.1.201" className={inputClass('ipAddress')} {...form.fieldProps('ipAddress')} />
              {error('ipAddress') && <p className="mt-1 text-xs text-red-600">{error('ipAddress')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Port</label>
              <input className={inputClass('port')} {...form.fieldProps('port')} />
              {error('port') && <p className="mt-1 text-xs text-red-600">{error('port')}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Comm key</label>
              <input className={inputClass('commKey')} {...form.fieldProps('commKey')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
              <input placeholder="Reception" className={inputClass('location')} {...form.fieldProps('location')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={form.isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300"
            >
              {editing ? 'Save changes' : 'Add device'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BiometricDevices;
