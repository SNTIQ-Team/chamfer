import type { Metadata } from 'next';
import ChamferModule from '@/modules/chamfer/ChamferModule';
import { ldJson, moduleLd, pageMeta } from '@/core/seo';

const DESCRIPTION = 'Draft letters to German authorities and courts, find the recipient, and export to PDF or DOCX.';

export const metadata: Metadata = pageMeta({ path: '/dt/chamfer', title: 'SNTIQ Chamfer | Deutschland Together', description: DESCRIPTION });

export default function ChamferPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(moduleLd('SNTIQ Chamfer', '/dt/chamfer', DESCRIPTION)) }} />
      <ChamferModule />
    </>
  );
}
