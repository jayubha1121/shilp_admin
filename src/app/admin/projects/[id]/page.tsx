import { CompleteProjectEditor } from '@/components/admin/CompleteProjectEditor';

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <CompleteProjectEditor id={id} />;
}