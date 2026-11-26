'use client';

import { useEffect, useState } from 'react';

import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import shell from '@/components/shell.module.css';
import s from '@/components/links.module.css';
import { DO_LINKS, linkPath, weekLinks, type DeepLink } from '@/lib/links';

function List({ title, links }: { title: string; links: DeepLink[] }) {
  return (
    <section>
      <h2 className={s.h}>{title}</h2>
      <ul className={s.list}>
        {links.map((l) => (
          <li key={l.url}>
            <a className={s.row} href={l.url}>
              <span><span className={s.app}>{l.app}</span>{l.what}</span>
              <span className={s.url}>{linkPath(l.url)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LinksPage() {
  // The hodi week link depends on today, so it is filled in on the device.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  return (
    <div className={shell.wrap}>
      <Nav current="links" />
      <main className={s.main}>
        <List title="Do" links={DO_LINKS} />
        {now !== null && <List title="Week" links={weekLinks(now)} />}
        <section>
          <h2 className={s.h}>On iPhone</h2>
          <ol className={s.how}>
            <li>Shortcuts app: new shortcut, action &quot;Open URLs&quot;, paste a link.</li>
            <li>Add it to the Home Screen, or to Settings, Accessibility, Touch, Back Tap.</li>
          </ol>
        </section>
      </main>
      <Footer />
    </div>
  );
}
