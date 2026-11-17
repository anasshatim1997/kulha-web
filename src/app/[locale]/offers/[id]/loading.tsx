import "@/components/offers/offer-detail.css";

// Mirrors <OfferDetail>: same grid, same blocks, same proportions.
export default function OfferDetailLoading() {
  return (
    <article className="kd" aria-busy="true">
      <span className="kd-sk" style={{ width: 150, height: 18, margin: "9px 0 14px" }} aria-hidden="true" />
      <div className="kd-layout" aria-hidden="true">
        <div className="kd-stage is-skeleton">
          <span className="kd-sk kd-sk--chip" />
          <span className="kd-sk kd-sk--art" />
        </div>

        <div className="kd-info">
          <div className="kd-merchant">
            <span className="kd-sk kd-sk--round" style={{ width: 44, height: 44 }} />
            <div style={{ display: "grid", gap: 7 }}>
              <span className="kd-sk" style={{ width: 130, height: 14 }} />
              <span className="kd-sk" style={{ width: 90, height: 12 }} />
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <span className="kd-sk" style={{ width: "78%", height: 34 }} />
            <span className="kd-sk" style={{ width: "100%", height: 12 }} />
            <span className="kd-sk" style={{ width: "70%", height: 12 }} />
          </div>

          <div className="kd-facts">
            {[0, 1, 2].map((item) => (
              <div key={item} className="kd-fact is-skeleton">
                <span className="kd-sk kd-sk--round" style={{ width: 20, height: 20 }} />
                <div><span className="kd-sk" style={{ width: "55%", height: 10 }} /><span className="kd-sk" style={{ width: "80%", height: 14 }} /></div>
              </div>
            ))}
          </div>

          <div className="kd-buy is-skeleton">
            <div className="kd-buy__price"><span className="kd-sk kd-sk--price" /></div>
            <div className="kd-buy__action">
              <span className="kd-sk" style={{ width: "60%", height: 14 }} />
              <div className="kd-buy__row">
                <span className="kd-sk" style={{ flex: 1, height: 48, borderRadius: 16 }} />
                <span className="kd-sk kd-sk--round" style={{ width: 48, height: 48 }} />
              </div>
            </div>
          </div>

          <div className="kd-know is-skeleton">
            <h2><span className="kd-sk" style={{ width: 110, height: 12 }} /></h2>
            <dl>
              {[0, 1, 2].map((item) => (
                <div key={item}>
                  <span className="kd-sk" style={{ width: 110, height: 14 }} />
                  <span className="kd-sk" style={{ width: item === 2 ? 190 : 150, height: 14 }} />
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading offer</span>
    </article>
  );
}
