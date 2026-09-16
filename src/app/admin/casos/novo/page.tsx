import { AdminJsonEditor } from "@/components/admin/AdminJsonEditor";
export default function Page() { return <AdminJsonEditor create title="Novo caso clínico" endpoint="/api/admin/catalog/cases" dataKey="case" template={{ lineId: "", slug: "", title: "", professional: "", sessions: 1, parameters: [], beforeImageId: "", afterImageId: "", imageRightsConfirmed: false, sortOrder: 0 }} />; }
