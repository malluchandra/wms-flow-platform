import { getFlows, toggleFlowActive, deleteFlow } from '@/lib/actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FlowsPage() {
  const flows = await getFlows();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Flows</h2>
        <Link
          href="/flows/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Flow
        </Link>
      </div>

      {flows.length === 0 ? (
        <p className="text-gray-500">No flows yet. Create one to get started.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">Name</th>
                <th className="text-left p-4 font-medium text-gray-600">Version</th>
                <th className="text-left p-4 font-medium text-gray-600">Environment</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-left p-4 font-medium text-gray-600">Steps</th>
                <th className="text-right p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((flow) => {
                const def = flow.definition as any;
                const stepCount = def?.steps?.length ?? 0;
                return (
                  <tr key={flow.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <Link href={`/flows/${flow.id}`} className="text-blue-600 hover:underline font-medium">
                        {flow.display_name}
                      </Link>
                      <div className="text-sm text-gray-400">{flow.name}</div>
                    </td>
                    <td className="p-4 text-gray-600">{flow.version}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        flow.environment === 'prod' ? 'bg-red-100 text-red-700' :
                        flow.environment === 'qa' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {flow.environment.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <form action={async () => {
                        'use server';
                        await toggleFlowActive(flow.id);
                      }}>
                        <button type="submit" className={`px-2 py-1 rounded text-xs font-medium ${
                          flow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {flow.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </form>
                    </td>
                    <td className="p-4 text-gray-600">{stepCount}</td>
                    <td className="p-4 text-right">
                      <Link href={`/flows/${flow.id}`} className="text-blue-600 hover:underline mr-3">Edit</Link>
                      <form action={async () => {
                        'use server';
                        await deleteFlow(flow.id);
                      }} className="inline">
                        <button type="submit" className="text-red-500 hover:underline">Delete</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
