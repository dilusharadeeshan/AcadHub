import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
export default function Guidelines() {
  const { user } = useAuth();
  return (
    <main className="standalone guidelines">
      <Link className="brand" to={user ? '/dashboard' : '/login'}>
        <span className="brand-mark">
          <GraduationCap size={23} />
        </span>
        <span className="brand-word">
          Acad<span>Hub</span>
        </span>
      </Link>
      <div className="panel">
        <span className="eyebrow">A COMMUNITY WORTH CARING FOR</span>
        <h1>
          Share thoughtfully.
          <br />
          Learn together.
        </h1>
        <p className="lead">
          AcadHub is a shared academic space. These guidelines help everyone feel welcome and find
          knowledge they can trust.
        </p>
        {[
          [
            'Keep it academic',
            'Share resources, questions, and explanations related to university learning. Avoid advertising, unrelated content, spam, harassment, and abusive language.',
          ],
          [
            'Share only what you have permission to share',
            'Use your own work, openly licensed materials, or content you have permission to distribute. Credit the original source. Do not upload copyrighted textbooks, restricted exam papers, or personal information without authorization.',
          ],
          [
            'Make room for understanding',
            'Explain your reasoning, ask clear questions, and treat other perspectives with respect. Use shared answers to understand a topic and follow your institution’s academic integrity rules.',
          ],
          [
            'Be clear about accuracy',
            'Peer contributions are not official faculty solutions unless explicitly verified. Explain limitations, correct mistakes, and report inaccurate, duplicate, or outdated resources.',
          ],
          [
            'Respect privacy',
            'Your name, department, and batch can appear beside your contributions. Your email and account status are available only to you and authorized staff. Password hashes and session data are never public. Do not post private information about yourself or others.',
          ],
          [
            'Understand review and removal',
            'New accounts require administrator approval. Uploaded resources and edits require moderator review. Moderators may reject or remove inaccurate, unauthorized, duplicate, or inappropriate content and suspend student accounts. Administrators manage account access and roles.',
          ],
          [
            'Report problems',
            'Use Report on a resource, comment, question, or answer. For copyright concerns, include the original source, the content in question, and enough information for staff to review it. Moderators record a resolution or dismissal; contact your batch administrator to follow up or appeal.',
          ],
          [
            'Know how your data is used',
            'Account details support access control and your academic profile. Contributions remain until removed by their owner or a moderator. Essential HTTP-only cookies keep you signed in and protect form submissions. Signing out revokes your session. Ask your administrator about account-data correction, export, deletion, or the institution’s retention policy.',
          ],
        ].map(([title, body], i) => (
          <section key={title}>
            <span className="guideline-number">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          </section>
        ))}
        <div className="notice">
          <ShieldCheck size={22} />
          <p>A useful community is a shared responsibility. Thank you for doing your part.</p>
        </div>
        <Link
          className="btn"
          to={user?.status === 'pending' ? '/pending' : user ? '/dashboard' : '/login'}
        >
          Back to {user ? 'your workspace' : 'sign in'}
        </Link>
      </div>
    </main>
  );
}
