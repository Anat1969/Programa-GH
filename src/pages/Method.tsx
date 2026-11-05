// שיטה: על איזה תקן כל שכבה נשענת, איך כל מדד נמדד מהגיאומטריה, ומה לא נמדד.
import Rich from '../components/Rich';
import { usePlan } from '../lib/state';
import { MIX_SIZE, GROSS, STREET } from '../lib/layout';

export default function Method() {
  const { scores } = usePlan();
  const ms = scores[0].measures;
  return (
    <main className="method">
      <header>
        <div className="crumbs"><a href="#/">בית</a> / שיטה</div>
        <Rich as="h1" className="m-h">{'**שלוש שכבות**, ולכל אחת התקן שלה.'}</Rich>
        <Rich as="p" className="m-s">{'הפרוגרמה מהמחשבון, ההעמדה מכללים גלויים, והציון מ-**9** מדדי שכונה 360 שאפשר למדוד מהמודל עצמו.'}</Rich>
      </header>
      <ol className="chain">
        <li className="link-card"><span className="q-n num">1</span><h3>פרוגרמה</h3><p className="std">משרד החינוך, הפנים, הבריאות, השיכון, פיקוד העורף, תמ"א 70</p><Rich as="p" className="rel">{'הנוסחאות **אחד לאחד** מהמחשבון ב-Lovable, כולל הספים של **1,000**, **2,000** ו-**3,000** נפש.'}</Rich><a className="src" href="https://pixel-perfect-clone-6624.lovable.app" target="_blank" rel="noreferrer">מחשבון הפרוגרמות</a></li>
        <li className="link-card"><span className="q-n num">2</span><h3>העמדה</h3><p className="std">כללים גלויים בקוד: src/lib/layout.ts</p><Rich as="p" className="rel">{`רחוב **${STREET}** מ', ברוטו **${GROSS}** לפלדלת, דירה **${MIX_SIZE.small}** עד **${MIX_SIZE.xl}** מ"ר, חניון בשתי קומות מתחת לבניינים. כל אלה **הנחות**.`}</Rich><span className="src">בדיקה אוטומטית: בלי חפיפות, הכול בתוך המגרש</span></li>
        <li className="link-card"><span className="q-n num">3</span><h3>ציון</h3><p className="std">שכונה 360, 44 מדדים, 120 נקודות</p><Rich as="p" className="rel">{'נמדדים **9** מדדים (**28** נקודות) מהגיאומטריה. **35** האחרים דורשים מסמכים, תהליך או ביצוע.'}</Rich><a className="src" href="https://shchuna-360.vercel.app" target="_blank" rel="noreferrer">שכונה 360: שער היעדים</a></li>
      </ol>
      <div className="m-grid">
        <section aria-label="המדדים">
          <h2 className="col-h">איך נמדד כל מדד</h2>
          <table className="notes">
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <th scope="row"><span className="mn num">{m.n}</span>{m.title}<small> · {m.max} נק'</small></th>
                  <td className="why">{m.rule}</td>
                  <td><span className={`status ${m.ruleStatus === 'הנחה' ? 'st-as' : 'st-ok'}`}>{m.ruleStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section aria-label="אמינות">
          <h2 className="col-h">איך הכלי מודד את האמינות שלו</h2>
          <div className="tone tone-insight"><h4>אותה פרוגרמה, שלוש צורות</h4><Rich as="p">{'הפרש בציון נובע רק מ**העמדה**. אם שתי חלופות קרובות בפחות מ-**0.5**, הכותרת אומרת שהן שקולות.'}</Rich></div>
          <div className="tone tone-neutral"><h4>המדד שמפריד</h4><Rich as="p">{'מוצג תמיד המדד עם **הפער הגדול** בין החלופות, כדי שיהיה ברור על מה ההחלטה נשענת.'}</Rich></div>
          <div className="tone tone-problem"><h4>מה לא נמדד</h4><Rich as="p">{'תהליך תכנון, אנרגיה, חומרים, פסולת ועצים בפועל. הם ב-**35** המדדים האחרים, ונבדקים בשכונה 360.'}</Rich></div>
        </section>
        <section className="museum" aria-label="ריכוז ידע">
          <blockquote>
            <p>“Cities have the capability of providing something for everybody, only because, and only when, they are created by everybody.”</p>
            <footer>ג'יין ג'ייקובס (Jane Jacobs), The Death and Life of Great American Cities, 1961</footer>
          </blockquote>
          <Rich as="p" className="m-ins">{'הפרוגרמה סופרת מטרים. ==ההעמדה מחליטה מי יפגוש את מי==, בגן, ברחוב ובפארק.'}</Rich>
          <p className="haiku">גן בפינת רחוב<br />אותם מטרים, ילד אחר<br />הולך לבד</p>
        </section>
      </div>
    </main>
  );
}
