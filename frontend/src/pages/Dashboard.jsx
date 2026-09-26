import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Plus,
  Users,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import {
  Empty,
  LoadState,
  PageTitle,
  QuestionRow,
  ResourceCard,
  SectionHeading,
  Stat,
} from '../components/UI';
export default function Dashboard() {
  const request = useApi('/dashboard'),
    subjects = useApi('/subjects'),
    { user } = useAuth();
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE CURIOSITY GOES A LONG WAY"
        title={'Hello, ' + user.name.split(' ')[0] + ' 👋'}
        description="Let’s make room for something new today."
      />
      <LoadState request={request}>
        {request.data && (
          <>
            <section className="dashboard-hero">
              <div>
                <span className="eyebrow">LEARN MORE. SHARE MORE. GROW TOGETHER.</span>
                <h2>
                  Your batch’s knowledge,
                  <br />
                  <em>all in one place.</em>
                </h2>
                <p>
                  From the notes you need to the answer that finally clicks.
                  <br className="desktop-only" /> Find it here. Pass it on.
                </p>
                <div className="button-row">
                  <Link className="btn" to="/resources">
                    <BookOpen size={17} />
                    Explore resources
                    <ArrowRight size={16} />
                  </Link>
                  <Link className="hero-link" to="/questions/new">
                    Ask a question <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <span className="art-spark s1">✦</span>
                <span className="art-spark s2">✧</span>
                <div className="art-card card-back"></div>
                <div className="art-card card-front">
                  <BookOpen size={45} />
                  <i />
                  <i />
                  <i />
                  <span>
                    MORE SHARED.
                    <br />
                    MORE UNDERSTOOD.
                  </span>
                </div>
                <div className="art-bubble">
                  <Lightbulb size={23} />
                </div>
              </div>
            </section>
            <div className="stats-grid">
              <Stat label="Shared resources" value={request.data.stats.resources} />
              <Stat
                label="Academic questions"
                value={request.data.stats.questions}
                icon={MessageSquare}
                tone="peach"
              />
              <Stat
                label="Learning together"
                value={request.data.stats.students}
                icon={Users}
                tone="mint"
              />
              <Stat
                label="Subjects to explore"
                value={request.data.stats.subjects}
                icon={GraduationCap}
                tone="blue"
              />
            </div>
            <div className="dashboard-columns">
              <div>
                <SectionHeading title="Fresh from your batch" to="/resources" />
                {request.data.recentResources.length ? (
                  <div className="resource-grid dashboard-resources">
                    {request.data.recentResources.map((item) => (
                      <ResourceCard item={item} key={item._id} compact />
                    ))}
                  </div>
                ) : (
                  <div className="panel">
                    <Empty
                      title="Start your batch’s library"
                      description="Your first shared resource can make a big difference."
                      action={
                        <Link className="btn" to="/resources/new">
                          <Plus size={17} />
                          Share a resource
                        </Link>
                      }
                    />
                  </div>
                )}
                <SectionHeading title="Conversations worth joining" to="/questions" />
                <div className="panel flush">
                  {request.data.recentQuestions.length ? (
                    request.data.recentQuestions.map((item) => (
                      <QuestionRow item={item} key={item._id} />
                    ))
                  ) : (
                    <Empty
                      title="Be the first to ask"
                      description="If you’re wondering about it, someone else probably is too."
                      action={
                        <Link className="btn secondary" to="/questions/new">
                          Ask a question
                        </Link>
                      }
                    />
                  )}
                </div>
              </div>
              <aside className="dashboard-rail">
                <div className="panel contribution-card">
                  <span className="eyebrow">YOUR CONTRIBUTION COUNTS</span>
                  <h2>
                    Small shares.
                    <br />
                    Big impact.
                  </h2>
                  <div className="contribution-numbers">
                    <div>
                      <strong>{request.data.stats.myResources}</strong>
                      <span>resources shared</span>
                    </div>
                    <div>
                      <strong>{request.data.stats.myQuestions}</strong>
                      <span>questions asked</span>
                    </div>
                  </div>
                  <Link to="/contributions" className="text-link">
                    See your contributions <ArrowRight size={16} />
                  </Link>
                  {request.data.stats.pending > 0 && (
                    <p className="small-text muted">
                      {request.data.stats.pending} resource(s) waiting for review
                    </p>
                  )}
                </div>
                <SectionHeading title="Explore by subject" to="/subjects" />
                <div className="panel subject-list">
                  {subjects.data?.items.slice(0, 5).map((subject) => (
                    <Link key={subject._id} to={'/resources?subject=' + subject._id}>
                      <span className="subject-initial">{subject.code.slice(0, 2)}</span>
                      <div>
                        <strong>{subject.name}</strong>
                        <span>
                          {subject.code} · Semester {subject.semester}
                        </span>
                      </div>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
                  {subjects.data?.items.length === 0 && (
                    <p className="muted">Your moderators will add subjects here.</p>
                  )}
                </div>
                <div className="community-tip">
                  <Lightbulb size={23} />
                  <h3>A good answer travels far.</h3>
                  <p>
                    Be clear, be kind, and give credit. A helpful explanation today could help a
                    whole batch tomorrow.
                  </p>
                  <Link to="/guidelines">
                    Our community guidelines <ArrowRight size={14} />
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </LoadState>
    </>
  );
}
