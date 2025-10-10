import React from 'react';
import Header from '../components/Header';

const TermsAndConditions = () => {
    return (
        <>
            <Header noMenu /> {/* 👈 Simple and clean */}
            <main className="max-w-3xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
                <main className="container" role="main">
                    <h1>Terms and Conditions</h1>

                    <p>Welcome to <strong>Wander Breeze</strong> ("we", "us", "our"). By accessing or using our website and services, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully.</p>

                    <section className="section" aria-labelledby="use-of-website">
                        <h2 id="use-of-website">1. Use of Website</h2>
                        <p>You agree to use our website only for lawful purposes and in accordance with these Terms. You must not use the website:</p>
                        <ul>
                            <li>In any way that violates any applicable law or regulation.</li>
                            <li>For the purpose of exploiting, harming, or attempting to exploit or harm others.</li>
                            <li>To transmit harmful code or viruses.</li>
                            <li>To interfere with the operation of the website.</li>
                        </ul>
                    </section>

                    <section className="section" aria-labelledby="accounts">
                        <h2 id="accounts">2. Accounts and Registration</h2>
                        <p>Some features may require creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
                    </section>

                    <section className="section" aria-labelledby="intellectual-property">
                        <h2 id="intellectual-property">3. Intellectual Property</h2>
                        <p>All content, logos, graphics, and materials on the website are owned by Wander Breeze or its licensors. You may not reproduce, distribute, or create derivative works without our prior written consent.</p>
                    </section>

                    <section className="section" aria-labelledby="user-content">
                        <h2 id="user-content">4. User Content</h2>
                        <p>Any content you submit to our website (reviews, comments, messages) must comply with applicable laws. By submitting content, you grant us a non-exclusive, royalty-free license to use, reproduce, and display it.</p>
                    </section>

                    <section className="section" aria-labelledby="disclaimer">
                        <h2 id="disclaimer">5. Disclaimer</h2>
                        <p>The website and services are provided "as is" without warranties of any kind, either express or implied. We do not guarantee the accuracy, completeness, or reliability of the content or services.</p>
                    </section>

                    <section className="section" aria-labelledby="limitation-of-liability">
                        <h2 id="limitation-of-liability">6. Limitation of Liability</h2>
                        <p>To the maximum extent permitted by law, Wander Breeze will not be liable for any damages, including indirect, incidental, or consequential damages, arising from your use of the website or services.</p>
                    </section>

                    <section className="section" aria-labelledby="links-to-other-sites">
                        <h2 id="links-to-other-sites">7. Links to Other Sites</h2>
                        <p>Our website may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any third-party sites.</p>
                    </section>

                    <section className="section" aria-labelledby="termination">
                        <h2 id="termination">8. Termination</h2>
                        <p>We may suspend or terminate your access to the website at any time, without notice, if you violate these Terms or engage in prohibited activities.</p>
                    </section>

                    <section className="section" aria-labelledby="governing-law">
                        <h2 id="governing-law">9. Governing Law</h2>
                        <p>These Terms are governed by and construed in accordance with the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in Trivandrum, India.</p>
                    </section>

                    <section className="section" aria-labelledby="changes-to-terms">
                        <h2 id="changes-to-terms">10. Changes to Terms</h2>
                        <p>We may update these Terms from time to time. Changes will be posted on this page with a new effective date. Your continued use of the website constitutes acceptance of the updated Terms.</p>
                    </section>

                    <section className="section" aria-labelledby="contact">
                        <h2 id="contact">11. Contact Us</h2>
                        <p>If you have questions about these Terms, please contact us at:</p>
                        <p><strong>Email:</strong> <a href="wanderbreezeexim@gmail.com">wanderbreezeexim@gmail.com</a></p>
                        <p><strong>Address:</strong> Wander Breeze — Thiruvananthapuram, Kerala, India</p>
                    </section>

                    <footer>
                    </footer>
                </main>
            </main>
        </>
    );
};

export default TermsAndConditions;
