import AppTile from '@/components/AppTile';
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
        {GROUPS.map((g, i) => (
          <section key={g.id} className={home.group} aria-labelledby={`g-${g.id}`}>
            <h2 className={home.label} id={`g-${g.id}`}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <b>{g.title}</b>
            </h2>
            <div className={`${home.grid} ${g.apps.length === 3 ? home.three : ''}`}>
              {g.apps.map((a) => <AppTile key={a.name} app={a} />)}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
