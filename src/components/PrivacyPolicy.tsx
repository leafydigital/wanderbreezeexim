import React from 'react';
import Header from '../components/Header';

const PrivacyPolicy = () => {
    return (
        <>
            <Header noMenu /> {/* 👈 Simple and clean */}
            <main className="max-w-3xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
                <main className="container" role="main">
                    <h1>Privacy Policy</h1>

                    <p>Welcome to <strong>Wander Breeze</strong> ("we", "us", "our"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and protect the information you provide on our website and related services.</p>

                    <section className="section" aria-labelledby="info-we-collect">
                        <h2 id="info-we-collect">1. Information we collect</h2>
                        <p>We collect information you provide to us directly and information that is collected automatically when you use our website.</p>
                        <h3>Information you provide</h3>
                        <ul>
                            <li>Contact details (name, email address, phone) when you contact us, subscribe, or make inquiries.</li>
                            <li>Account information if you create an account (username, password — stored securely).</li>
                            <li>Content you submit (reviews, messages, uploads) when you choose to share them.</li>
                        </ul>
                        <h3>Information collected automatically</h3>
                        <ul>
                            <li>Usage data such as pages visited, time on site, referring URLs, and browser/operating system details.</li>
                            <li>Device and connection information (IP address, device type, screen size).</li>
                            <li>Cookies and similar tracking technologies (see "Cookies and tracking" below).</li>
                        </ul>
                    </section>

                    <section className="section" aria-labelledby="how-we-use">
                        <h2 id="how-we-use">2. How we use your information</h2>
                        <p>We use the information we collect for purposes including:</p>
                        <ul>
                            <li>To provide, maintain, and improve our website and services.</li>
                            <li>To respond to your requests and communicate updates or promotional messages (where permitted).</li>
                            <li>To personalize your experience and show relevant content.</li>
                            <li>For analytics, security, and fraud prevention.</li>
                            <li>To comply with legal obligations.</li>
                        </ul>
                    </section>

                    <section className="section" aria-labelledby="legal-basis">
                        <h2 id="legal-basis">3. Legal basis for processing (where applicable)</h2>
                        <p>If you are in the European Economic Area (EEA), we process personal data based on the following legal grounds:</p>
                        <ul>
                            <li>Performance of a contract (providing the services you requested).</li>
                            <li>Legitimate interests (e.g., improving our site, preventing fraud) balanced against your rights.</li>
                            <li>Your consent where required (for newsletters, marketing communications).</li>
                            <li>Compliance with legal obligations.</li>
                        </ul>
                    </section>

                    <section className="section" aria-labelledby="cookies">
                        <h2 id="cookies">4. Cookies and tracking</h2>
                        <p>We and our service providers use cookies and similar technologies to operate and improve our website, understand how you use it, and show relevant content. You can manage or disable cookies through your browser settings, but some features may stop working properly if cookies are disabled.</p>
                    </section>

                    <section className="section" aria-labelledby="sharing">
                        <h2 id="sharing">5. Sharing and disclosure</h2>
                        <p>We may share personal information in the following situations:</p>
                        <ul>
                            <li>With service providers who perform services on our behalf (hosting, analytics, payment processing).</li>
                            <li>When required by law, legal process, or to protect rights and safety.</li>
                            <li>In connection with a business transfer (sale, merger, or reorganization).</li>
                            <li>With your consent or at your direction.</li>
                        </ul>
                    </section>

                    <section className="section" aria-labelledby="third-parties">
                        <h2 id="third-parties">6. Third-party services</h2>
                        <p>We use third-party services (such as analytics, advertising, and payment processors) that may collect or process information about you. Their services are governed by their own privacy policies — please review those policies before using our website.</p>
                    </section>

                    <section className="section" aria-labelledby="data-security">
                        <h2 id="data-security">7. Data security</h2>
                        <p>We implement reasonable administrative, technical, and physical safeguards to protect personal data. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
                    </section>

                    <section className="section" aria-labelledby="retention">
                        <h2 id="retention">8. Data retention</h2>
                        <p>We retain personal data for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Retention periods vary by the type of data and the purposes for which it was collected.</p>
                    </section>

                    <section className="section" aria-labelledby="rights">
                        <h2 id="rights">9. Your rights</h2>
                        <p>Depending on where you live, you may have certain rights regarding your personal data, including:</p>
                        <ul>
                            <li>The right to access or receive a copy of your personal data.</li>
                            <li>The right to correct inaccurate data.</li>
                            <li>The right to request deletion or restriction of processing.</li>
                            <li>The right to object to processing or to withdraw consent (where applicable).</li>
                            <li>The right to data portability.</li>
                        </ul>
                        <p>To exercise these rights, please contact us using the details below. We may need to verify your identity before responding.</p>
                    </section>

                    <section className="section" aria-labelledby="children">
                        <h2 id="children">10. Children</h2>
                        <p>Our website is not directed at children under 13 (or a higher age where required by local law). We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us and we will take steps to delete it.</p>
                    </section>

                    <section className="section" aria-labelledby="links">
                        <h2 id="links">11. Links to other sites</h2>
                        <p>Our site may contain links to third-party websites. We are not responsible for their privacy practices. Please review the privacy policies of any sites you visit.</p>
                    </section>

                    <section className="section" aria-labelledby="changes">
                        <h2 id="changes">12. Changes to this policy</h2>
                        <p>We may update this Privacy Policy from time to time. When we do, we will post the updated policy with a new effective date. Continued use of the site after changes means you accept the updated policy.</p>
                    </section>

                    <section className="section" aria-labelledby="contact">
                        <h2 id="contact">13. Contact us</h2>
                        <p>If you have questions or requests about this Privacy Policy, please contact us at:</p>
                        <p><strong>Email:</strong> <a href="mailto:wanderbreezeexim@gmail.com">wanderbreezeexim@gmail.com</a></p>
                        <p><strong>Address:</strong> Wander Breeze — Thiruvananthapuram, Kerala, India</p>
                    </section>

                    <footer>
                    </footer>
                </main>
            </main>
        </>
    );
};

export default PrivacyPolicy;
