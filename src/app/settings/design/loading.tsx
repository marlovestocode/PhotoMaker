export default function DesignSettingsLoading() {
    return (
        <div aria-busy="true" className="studio-boot" role="status">
            <span className="studio-sr-only">Loading the design studio…</span>
            <div className="studio-boot__topbar">
                <span aria-hidden="true" className="studio-boot__mark" />
                <span aria-hidden="true" className="studio-boot__line studio-boot__line--short" />
                <span aria-hidden="true" className="studio-boot__line studio-boot__line--wide" />
            </div>
            <div aria-hidden="true" className="studio-boot__body studio-boot__pulse">
                <div className="studio-boot__panel">
                    <span className="studio-boot__line studio-boot__line--wide" />
                    <span className="studio-boot__chip" />
                    <span className="studio-boot__line studio-boot__line--short" />
                    <span className="studio-boot__chip studio-boot__chip--tall" />
                    <span className="studio-boot__chip studio-boot__chip--tall" />
                    <span className="studio-boot__chip studio-boot__chip--tall" />
                </div>
                <div className="studio-boot__canvas">
                    <div className="studio-boot__stage" />
                </div>
                <div className="studio-boot__panel">
                    <span className="studio-boot__line studio-boot__line--short" />
                    <span className="studio-boot__line studio-boot__line--wide" />
                    <span className="studio-boot__chip studio-boot__chip--tall" />
                    <span className="studio-boot__line" />
                    <span className="studio-boot__line" />
                </div>
            </div>
        </div>
    );
}
