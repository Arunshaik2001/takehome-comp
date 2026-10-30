export function SiteFooter() {
  return (
    <footer className="mt-12 space-y-6 rounded-2xl border border-stone-200/80 bg-white/60 p-6 text-sm leading-relaxed text-stone-600 backdrop-blur dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-400 sm:p-8">
      <div>
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
          About this site
        </h2>
        <p className="mt-2">
          Takehome Comp summarizes publicly shared India compensation posts and
          applies a transparent tax and payroll model to show estimated monthly
          net pay. It is an independent reference tool for candidates comparing
          offers—not an official compensation or tax filing service.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
          Data sources
        </h3>
        <p className="mt-2">
          Offer figures originate from user-generated threads on{" "}
          <a
            href="https://leetcode.com/discuss/topic/compensation/"
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            LeetCode Discuss
          </a>{" "}
          tagged <span className="font-mono text-xs">#compensation</span>.
          Structured fields are derived from public community parsing pipelines
          (see{" "}
          <a
            href="https://github.com/0xku/leetcode-compensation"
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            leetcode-compensation
          </a>
          ). We do not verify posts with employers. Amounts may be outdated,
          incomplete, or inaccurate.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
          Estimates and professional advice
        </h3>
        <p className="mt-2">
          All in-hand figures are illustrative estimates only. Models use
          simplified assumptions (for example: India new tax regime FY 2025–26,
          standard deduction, 4% health &amp; education cess on tax, employee PF
          on a wage ceiling, and typical professional tax). Your actual payslip depends on salary structure,
          city, regime choice, investments, and employer policies. Nothing on
          this site is tax, legal, investment, or employment advice. Consult a
          qualified chartered accountant or employer HR before making decisions.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
          Trademarks and affiliation
        </h3>
        <p className="mt-2">
          LeetCode and related marks are trademarks of their respective owners.
          This project is not affiliated with, endorsed by, or sponsored by
          LeetCode or any company listed in the data. Company names and roles
          appear solely to describe publicly posted offers.
        </p>
      </div>

      <p className="border-t border-stone-200/80 pt-4 text-xs text-stone-500 dark:border-stone-700 dark:text-stone-500">
        By using this site you agree that estimates are provided as is without
        warranty. Use at your own risk.
      </p>
    </footer>
  );
}
