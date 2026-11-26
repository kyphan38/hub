import AppTile from '@/components/AppTile';
import DailySection from '@/components/DailySection';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import home from '@/components/home.module.css';
import shell from '@/components/shell.module.css';
import { GROUPS } from '@/lib/apps';

export default function Home() {
  return (
    <div className={shell.wrap}>
      <Nav current="apps" />
      <main>
        {GROUPS.map((g, i) =>
          g.id === 'daily' ? (
            <DailySection key={g.id} index={i + 1} title={g.title} apps={g.apps} />
          ) : (
          <section key={g.id} className={home.group} aria-labelledby={`g-${g.id}`}>
            <h2 className={home.label} id={`g-${g.id}`}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <b>{g.title}</b>
              <span className={home.rule} />
            </h2>
            <div className={home.grid}>
              {g.apps.map((a) => <AppTile key={a.name} app={a} />)}
            </div>
          </section>
          ),
        )}
      </main>
      <Footer />
    </div>
  );
}
