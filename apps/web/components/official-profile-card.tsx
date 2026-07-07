interface OfficialProfile {
  id: string;
  slug: string;
  name: string;
  category: string;
  county: string | null;
  district: string | null;
  politicalParty: string | null;
  termStartDate: string | null;
  termEndDate: string | null;
  officialEmail: string;
  phone: string | null;
  bio: string | null;
  photoUrl: string | null;
  officeHours: string | null;
  officeAddress: string | null;
  stats: { activePetitions: number; resolvedCount: number };
}

interface OfficeHoursEntry {
  day: string;
  openTime: string;
  closeTime: string;
}

function parseOfficeHours(raw: string | null): OfficeHoursEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function OfficialProfileCard({ profile }: { profile: OfficialProfile }) {
  const officeHours = parseOfficeHours(profile.officeHours);
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoUrl}
            alt={profile.name}
            className="h-28 w-28 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl font-bold text-emerald-700">
            {profile.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
            ✓ Verified Government Official
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-zinc-900 break-words">{profile.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {profile.category.replaceAll('_', ' ')}
            {profile.county ? ` · ${profile.county}` : ''}
            {profile.district ? ` · District ${profile.district}` : ''}
          </p>
          {profile.politicalParty && <p className="mt-1 text-sm text-zinc-500">{profile.politicalParty}</p>}
          {(profile.termStartDate || profile.termEndDate) && (
            <p className="mt-1 text-sm text-zinc-500">
              Term: {profile.termStartDate ? new Date(profile.termStartDate).getFullYear() : 'Unknown'}
              {' – '}
              {profile.termEndDate ? new Date(profile.termEndDate).getFullYear() : 'Present'}
            </p>
          )}
        </div>
      </div>

      {profile.bio && <p className="mt-6 text-sm text-zinc-700 whitespace-pre-line">{profile.bio}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Active petitions</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">{profile.stats.activePetitions}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-700">Resolved issues</p>
          <p className="mt-2 text-2xl font-semibold text-blue-900">{profile.stats.resolvedCount}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
        <p>Office email: {profile.officialEmail}</p>
        {profile.phone && <p>Phone: {profile.phone}</p>}
        {profile.officeAddress && <p>Office address: {profile.officeAddress}</p>}
        {officeHours.length > 0 && (
          <div className="mt-2">
            <p className="font-semibold text-zinc-700">Office hours</p>
            <ul>
              {officeHours.map((entry, idx) => (
                <li key={`${entry.day}-${idx}`}>
                  {entry.day}: {entry.openTime} – {entry.closeTime}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
