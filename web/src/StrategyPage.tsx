import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getStrategyGuideById, strategyAssumptions } from "./stageGuides";
import type { StageGuide } from "./stageGuides";
import type { ReactNode } from "react";

export function StrategyDetailPage() {
  const { id } = useParams();
  const guide = getStrategyGuideById(id);
  if (!guide) return <Navigate replace to="/record" />;

  return (
    <div className="page strategy-page">
      <header className="page-header strategy-page-header">
        <div>
          <p>{guide.weapon} / {guide.ruleName}</p>
          <h1>{guide.stage} 攻略詳細</h1>
        </div>
        <Link className="icon-text-button" to="/record">
          <ArrowLeft aria-hidden="true" size={16} />
          試合記録へ
        </Link>
      </header>

      <section className="surface strategy-hero">
        <img alt={`${guide.stage} ${guide.ruleName}の攻略詳細図`} src={guide.assets.detailImage} />
        <div>
          <p>{guide.detail.basicPlan}</p>
          <div className="strategy-kit">
            <span>{guide.weaponKit.sub}</span>
            <span>{guide.weaponKit.special}</span>
          </div>
          <small>{strategyAssumptions.mapOrientation}</small>
        </div>
      </section>

      <div className="strategy-detail-grid">
        <StrategySection title="初動">
          <DescriptionList
            rows={[
              ["ルート", guide.detail.opening.route],
              ["最初の目標", guide.detail.opening.firstGoal],
              ["避ける動き", guide.detail.opening.avoid],
            ]}
          />
        </StrategySection>

        <StrategySection title="重要ポジション">
          <div className="strategy-position-list">
            {guide.detail.keyPositions.map((position) => (
              <article key={position.id}>
                <h3>{position.label}</h3>
                <p>{position.purpose}</p>
                <small>{position.risk}</small>
              </article>
            ))}
          </div>
        </StrategySection>

        <StrategySection title="中盤">
          <BulletList items={guide.detail.neutral} />
        </StrategySection>

        <StrategySection title="有利">
          <BulletList items={guide.detail.advantage} />
        </StrategySection>

        <StrategySection title="不利">
          <BulletList items={guide.detail.disadvantage} />
        </StrategySection>

        <StrategySection title="打開">
          <BulletList items={guide.detail.comeback.steps} ordered />
        </StrategySection>

        <StrategySection title="防衛">
          <BulletList items={guide.detail.defense.priorities} ordered />
        </StrategySection>

        <StrategySection title="ウルトラショット">
          <DescriptionList
            rows={[
              ["攻め", guide.detail.specialUsage.trizooka.attack],
              ["打開", guide.detail.specialUsage.trizooka.comeback],
              ["防衛", guide.detail.specialUsage.trizooka.defense],
            ]}
          />
        </StrategySection>

        <StrategySection title="ルート">
          <div className="strategy-position-list">
            {guide.detail.routes.map((route) => (
              <article key={route.id}>
                <h3>{route.label}</h3>
                <p>{route.description}</p>
              </article>
            ))}
          </div>
        </StrategySection>

        <StrategySection title="敵の脅威">
          <BulletList items={guide.detail.enemyThreats} />
        </StrategySection>

        <StrategySection title="よくあるミス">
          <BulletList items={guide.detail.mistakes} />
        </StrategySection>

        <StrategySection title="図の番号">
          <div className="strategy-annotation-list">
            {guide.detail.mapAnnotations.map((annotation) => (
              <div key={annotation.number}>
                <b>{annotation.number}</b>
                <span>{annotation.label}</span>
              </div>
            ))}
          </div>
        </StrategySection>
      </div>
    </div>
  );
}

function StrategySection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="surface strategy-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="strategy-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Tag>
  );
}

function DescriptionList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="strategy-description-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
