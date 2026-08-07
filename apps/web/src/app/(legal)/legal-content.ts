export type LegalBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'notice'; text: string }
    | { type: 'list'; items: string[] }
    | { type: 'address'; lines: string[] }
    | { type: 'subheading'; text: string };

export interface LegalSection {
    id: string;
    title: string;
    blocks: LegalBlock[];
}

export interface LegalDocument {
    title: string;
    eyebrow: string;
    lastUpdated: string;
    intro: string[];
    sections: LegalSection[];
}

export const termsDocument: LegalDocument = {
    title: 'Terms of Service',
    eyebrow: 'Legal',
    lastUpdated: 'June 4, 2026',
    intro: [
        'Please read these terms carefully and keep a copy of them for your reference. There may be specific terms or conditions applicable to you as a user in a given jurisdiction, as detailed below.',
        'Please refer to our Privacy Policy, available at /privacy-policy, for information about how we collect, use, share, and otherwise process information about you.',
    ],
    sections: [
        {
            id: 'agreement-to-terms',
            title: 'Agreement to Terms',
            blocks: [
                {
                    type: 'paragraph',
                    text: `This End User License Agreement and Terms of Service ("EULA" or "Terms") is a binding contract between you, an individual user or site visitor, whether personally or on behalf of an entity ("user," "you," "your") and the Solana Foundation (the "Foundation," "we," "us" or "our") concerning use of the Foundation's services (the "Service"), including the Tokens websites, applications, APIs, documentation, and any other media form, media channel, or mobile website related, linked, or otherwise connected thereto (collectively, the "Site").`,
                },
                {
                    type: 'paragraph',
                    text: `Currently, the Foundation maintains and operates Tokens as a portal for news, information, market data, developer tools, and updates about tokens, the Solana protocol or blockchain (the "Solana Network"), and the Solana ecosystem. For the avoidance of doubt, the Foundation does not control the Solana Network and cannot control activity and data on the Solana Network, the activities of persons who develop and use applications on the Network, the validation of transactions on the Solana Network, or use of the Solana Network. The Solana Network is an open-source protocol that is maintained and processed by Solana Network validators across the globe.`,
                },
                {
                    type: 'notice',
                    text: 'BY ACCESSING OR USING THE SERVICE, YOU AGREE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THE EULA. IF YOU DO NOT AGREE, PLEASE DO NOT USE THE SERVICE OR SITE.',
                },
                {
                    type: 'paragraph',
                    text: 'Supplemental terms and conditions or documents that may be posted on the Site from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to this EULA at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of the EULA, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review the EULA to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised EULA by your continued use of the Service after the date such revised EULA is posted.',
                },
                {
                    type: 'paragraph',
                    text: 'The information provided on the Site is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Site from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.',
                },
                {
                    type: 'paragraph',
                    text: 'The Service is intended for users who are at least 18 years old. You agree that by using the Site and the Service you are at least 18 years of age, or accessing the Service under the supervision of a parent or guardian, and you are legally able to enter into a contract. If you are a parent or legal guardian of a user under the age of 18 or the age of legal majority, you agree to be fully responsible for the acts or omissions of such user in relation to the Service.',
                },
                {
                    type: 'paragraph',
                    text: 'If you use the Service on behalf of another person or entity, (a) all references to "you" throughout the EULA will include that person or entity, (b) you represent that you are authorized to accept these Terms on that person\'s or entity\'s behalf, and (c) in the event you or the person or entity violates these Terms, the person or entity agrees to be responsible to us.',
                },
                {
                    type: 'notice',
                    text: 'PLEASE NOTE: THE "DISPUTE RESOLUTION" SECTION OF THIS EULA CONTAINS AN ARBITRATION CLAUSE THAT REQUIRES DISPUTES TO BE ARBITRATED ON AN INDIVIDUAL BASIS, AND PROHIBITS CLASS ACTION CLAIMS. IT AFFECTS HOW DISPUTES BETWEEN YOU AND THE FOUNDATION ARE RESOLVED. BY ACCEPTING THIS EULA, YOU AGREE TO BE BOUND BY THIS ARBITRATION PROVISION. PLEASE READ IT CAREFULLY.',
                },
            ],
        },
        {
            id: 'scope-of-license',
            title: 'Scope of License to Users',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'The Service is licensed, not sold, to you for use only under the terms of the EULA, subject to your complete and ongoing compliance with the terms and conditions of the EULA. The Foundation hereby grants you a personal, limited, revocable, non-transferable license to access and use the Service solely for your own use.',
                },
                {
                    type: 'paragraph',
                    text: 'You may not modify, alter, reproduce, or distribute the Service. You may not directly rent, lease, lend, sell, redistribute or sublicense the Service. You may not copy, decompile, reverse engineer, disassemble, attempt to derive the source code of, modify, or create derivative works of any portion of the Service, any updates, or any part thereof, except as and only to the extent any foregoing restriction is prohibited by applicable law, nor attempt to disable or circumvent any security or other technological measure designed to protect the Service or any content available through the Service.',
                },
                {
                    type: 'paragraph',
                    text: 'If you breach these license restrictions, or otherwise exceed the scope of the licenses granted in the EULA, then you may be subject to prosecution and damages, as well as liability for infringement of intellectual property rights, and denial of access to the Service.',
                },
                {
                    type: 'notice',
                    text: 'WITHOUT LIMITING ANY OTHER PROVISION OF THIS EULA, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICE, INCLUDING BLOCKING CERTAIN IP ADDRESSES, TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THIS EULA OR OF ANY APPLICABLE LAW OR REGULATION.',
                },
                {
                    type: 'paragraph',
                    text: 'We may terminate your use or participation in the Site at any time, without warning, in our sole discretion. If we terminate or suspend your access to the Site for any reason, you are prohibited from attempting to access the Site under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your access, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.',
                },
            ],
        },
        {
            id: 'prohibited-activities',
            title: 'Prohibited Activities',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'You may not access or use the Service for any purpose other than that for which we make the Service available. The Service may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.',
                },
                { type: 'subheading', text: 'As a user of the Service, you agree not to:' },
                {
                    type: 'list',
                    items: [
                        'Systematically retrieve data or other content from the Service to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.',
                        'Make any unauthorized use of the Service, including collecting usernames or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.',
                        'Circumvent, disable, or otherwise interfere with security-related features of the Service, including features that prevent or restrict the use or copying of any content or enforce limitations on the use of the Service or the content contained therein.',
                        'Engage in unauthorized framing of or linking to the Site.',
                        'Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.',
                        'Make improper use of our support services or submit false reports of abuse or misconduct.',
                        'Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.',
                        'Interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site.',
                        'Attempt to impersonate another user or person.',
                        'Use any information obtained from the Site in order to harass, abuse, or harm another person.',
                        'Use the Service as part of any effort to compete with us or otherwise use the Service or the content for any revenue-generating endeavor or commercial enterprise.',
                        'Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Site.',
                        'Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Service to you.',
                        'Attempt to bypass any measures of the Site designed to prevent or restrict access to the Site, or any portion of the Site.',
                        'Delete the copyright or other proprietary rights notice from any content.',
                        "Copy or adapt the Site's software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.",
                        "Upload or transmit, or attempt to upload or transmit, viruses, Trojan horses, or other material, including excessive use of capital letters and spamming, that interferes with any party's uninterrupted use and enjoyment of the Service or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Service.",
                        'Upload or transmit, or attempt to upload or transmit, any material that acts as a passive or active information collection or transmission mechanism, including without limitation clear graphics interchange formats, 1x1 pixels, web bugs, cookies, or other similar devices.',
                        'Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation any spider, robot, cheat utility, scraper, or offline reader that accesses the Site, or use or launch any unauthorized script or other software.',
                        'Disparage, tarnish, distribute hate speech or explicit content, or otherwise harm, in our opinion, us, the Service, or other users of the Service.',
                        'Copy, reproduce, distribute, publicly perform or publicly display all portions of our Service, except as expressly permitted by us or our licensors.',
                        'Modify our Service, remove any proprietary rights notices or markings, or otherwise make any derivative works based upon our Service.',
                        'Infringe any patent, trademark, trade secret, copyright, or other intellectual or proprietary right of the Foundation or any third party.',
                        'Use the Service in a manner inconsistent with any applicable laws or regulations.',
                    ],
                },
            ],
        },
        {
            id: 'site-management',
            title: 'Site Management',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'We reserve the right, but not the obligation, to: (1) monitor the Site for violations of this EULA; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or this EULA, including without limitation reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, notice, or liability, remove from the Site or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (4) otherwise manage the Site in a manner designed to protect our rights and property and to facilitate the proper functioning of the Site.',
                },
            ],
        },
        {
            id: 'trademarks',
            title: 'Trademarks',
            blocks: [
                {
                    type: 'paragraph',
                    text: '"Solana," "Tokens," our logos, our product or service names, our slogans, and the look and feel of the Service are trademarks of the Foundation and may not be copied, imitated or used, in whole or in part, without our prior written permission, which may be obtained by emailing operations@solana.foundation. All other trademarks, registered trademarks, product names, and company names or logos mentioned on the Service are the property of their respective owners. Reference to any products, services, processes, or other information by trade name, trademark, manufacturer, supplier, or otherwise does not constitute or imply endorsement, sponsorship, or recommendation by us.',
                },
            ],
        },
        {
            id: 'repeat-infringer-policy',
            title: 'Repeat Infringer Policy',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'The Foundation maintains a policy to suspend or terminate user accounts that repeatedly infringe the intellectual property rights of others.',
                },
            ],
        },
        {
            id: 'copyright-infringement',
            title: 'Copyright Infringement Notice',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'The Foundation complies with the Digital Millennium Copyright Act ("DMCA") and responds to notices alleging copyright infringement in accordance with Section 512 of the DMCA. This section also establishes procedures for counter-notifications in cases where a user disputes the removal of content.',
                },
                {
                    type: 'subheading',
                    text: 'To submit a DMCA takedown notice, please provide the following information:',
                },
                {
                    type: 'list',
                    items: [
                        'Your electronic or physical signature. Typing your full name in an email or webform is sufficient.',
                        'A description of the copyrighted work you believe has been infringed, along with a URL or location where we can review the original work.',
                        "Identification of the material that you claim is infringing and its location, such as a URL, on the Foundation's website, application, or service.",
                        'Your contact information, including name, address, telephone number, and email address.',
                        'A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, their agent, or the law.',
                        'A statement under penalty of perjury that the information in your notice is accurate and that you are the copyright owner or authorized to act on behalf of the owner.',
                    ],
                },
                {
                    type: 'subheading',
                    text: "Please submit your notice to the Foundation's designated copyright agent:",
                },
                {
                    type: 'address',
                    lines: [
                        'Solana Foundation',
                        'Attn: Copyright Agent',
                        '16 Dammstrasse, 6300 Zug Switzerland',
                        'Email: dmcaagent@solana.org',
                        '+41 41 562 73 63',
                    ],
                },
                {
                    type: 'paragraph',
                    text: 'By submitting a notice, you acknowledge that the Foundation may share the information you provide with the individual who posted the allegedly infringing content.',
                },
                {
                    type: 'notice',
                    text: "Important Legal Notice: Copyright law requires that you consider applicable defenses such as fair use before submitting a takedown request. If you are unsure whether the material infringes your copyright, you should seek legal advice. Submitting false claims may result in liability under 17 U.S.C. 512(f), including damages, costs, and attorneys' fees.",
                },
                { type: 'subheading', text: 'Submitting a Counter-Notice' },
                {
                    type: 'paragraph',
                    text: "If your content has been removed or disabled as a result of a DMCA notice and you believe it was wrongly removed, you may submit a counter-notice to the Foundation's copyright agent.",
                },
                { type: 'subheading', text: 'A valid counter-notice must include:' },
                {
                    type: 'list',
                    items: [
                        'Your physical or electronic signature.',
                        'Identification of the material that was removed or disabled and the location where it appeared before removal.',
                        'A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.',
                        'Your name, address, and telephone number.',
                        'A statement that you consent to the jurisdiction of the federal district court in which your address is located, or if outside the U.S., any judicial district in which the Foundation may be found, and that you will accept service of process from the person who filed the original DMCA notice.',
                    ],
                },
                {
                    type: 'paragraph',
                    text: 'Upon receipt of a valid counter-notice, the Foundation may forward it to the party who submitted the original infringement notice. If that party does not file a court action within ten business days, the Foundation may, at its discretion, restore the removed material.',
                },
            ],
        },
        {
            id: 'dispute-resolution',
            title: 'Dispute Resolution',
            blocks: [
                {
                    type: 'notice',
                    text: 'Please read the following section carefully because it requires you to arbitrate certain disputes and claims with the Foundation and limits the manner in which you can seek relief from us, unless you opt out of arbitration by following the instructions set forth below. No class or representative actions or arbitrations are allowed under this arbitration provision. In addition, arbitration precludes you from suing in court or having a jury trial.',
                },
                {
                    type: 'paragraph',
                    text: '(a) No Representative Actions. You and the Foundation agree that any dispute arising out of or related to this EULA or the Service is personal to you and the Foundation and that any dispute will be resolved solely through individual action, and will not be brought as a class arbitration, class action or any other type of representative proceeding.',
                },
                {
                    type: 'paragraph',
                    text: '(b) Arbitration of Disputes. You and the Foundation waive your rights to a jury trial and to have any other dispute arising out of or related to this EULA and the Service, including claims related to privacy and data security, collectively, "Disputes," resolved in court. Instead, for any Dispute that you have against the Foundation you agree to first contact the Foundation and attempt to resolve the claim informally by sending a written notice of your claim ("Notice") to the Foundation by email at operations@solana.foundation or by certified mail addressed to Dammstrasse 16, 6300 Zug, Switzerland.',
                },
                {
                    type: 'paragraph',
                    text: 'The Notice must (a) include your name, residence address, email address, and telephone number; (b) describe the nature and basis of the Dispute; and (c) set forth the specific relief sought. Our notice to you will be similar in form to that described above. If you and the Foundation cannot reach an agreement to resolve the Dispute within thirty (30) days after such Notice is received, then either party may submit the Dispute to binding arbitration administered by JAMS or, under the limited circumstances set forth above, in court.',
                },
                {
                    type: 'paragraph',
                    text: 'All Disputes submitted to JAMS will be resolved through confidential, binding arbitration before one arbitrator. Arbitration proceedings will be held in Zug, Switzerland. You and the Foundation agree that Disputes will be held in accordance with the JAMS Streamlined Arbitration Rules and Procedures ("JAMS Rules"). The most recent version of the JAMS Rules are available on the JAMS website and are hereby incorporated by reference. You either acknowledge and agree that you have read and understand the JAMS Rules or waive your opportunity to read the JAMS Rules and waive any claim that the JAMS Rules are unfair or should not apply for any reason.',
                },
                {
                    type: 'paragraph',
                    text: '(c) You and the Foundation agree that these Terms affect interstate commerce and that the enforceability of this Section will be substantively and procedurally governed by the Federal Arbitration Act, 9 U.S.C. 1, et seq. (the "FAA"), to the maximum extent permitted by applicable law. As limited by the FAA, these Terms and the JAMS Rules, the arbitrator will have exclusive authority to make all procedural and substantive decisions regarding any Dispute and to grant any remedy that would otherwise be available in court, including the power to determine the question of arbitrability. The arbitrator may conduct only an individual arbitration and may not consolidate more than one individual\'s claims, preside over any type of class or representative proceeding or preside over any proceeding involving more than one individual.',
                },
                {
                    type: 'paragraph',
                    text: '(d) The arbitration will allow for the discovery or exchange of non-privileged information relevant to the Dispute. The arbitrator, the Foundation, and you will maintain the confidentiality of any arbitration proceedings, judgments and awards, including information gathered, prepared and presented for purposes of the arbitration or related to the Dispute therein. The arbitrator will have the authority to make appropriate rulings to safeguard confidentiality, unless the law provides to the contrary.',
                },
                {
                    type: 'paragraph',
                    text: '(e) You and the Foundation agree that for any arbitration you initiate, you will pay the filing fee, up to a maximum of $250 if you are a consumer, and the Foundation will pay the remaining JAMS fees and costs. For any arbitration initiated by the Foundation, the Foundation will pay all JAMS fees and costs. You and the Foundation agree that the Kanton of Zug shall have exclusive jurisdiction over any appeals and the enforcement of an arbitration award.',
                },
                {
                    type: 'paragraph',
                    text: '(f) Any Dispute must be filed within one year after the relevant claim arose; otherwise, the Dispute is permanently barred, which means that you and the Foundation will not have the right to assert the claim.',
                },
                {
                    type: 'paragraph',
                    text: '(g) You have the right to opt out of binding arbitration within 30 days of the date you first accepted the terms of this Section by mailing an opt-out notice to the Foundation at Dammstrasse 16, 6300 Zug, Switzerland. In order to be effective, the opt-out notice must include your full name and address and clearly indicate your intent to opt out of binding arbitration. By opting out of binding arbitration, you are agreeing to resolve Disputes in accordance with the governing law and venue terms of this EULA.',
                },
                {
                    type: 'paragraph',
                    text: "(h) If any portion of this Section is found to be unenforceable or unlawful for any reason, the unenforceable or unlawful provision shall be severed from these Terms, severance shall have no impact whatsoever on the remainder of this Section or the parties' ability to compel arbitration of any remaining claims on an individual basis, and to the extent that any claims must therefore proceed on a class, collective, consolidated, or representative basis, such claims must be litigated in a civil court of competent jurisdiction and not in arbitration.",
                },
            ],
        },
        {
            id: 'governing-law-and-venue',
            title: 'Governing Law and Venue',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'Any dispute arising from these Terms and your use of the Service will be governed by and construed and enforced in accordance with the laws of Switzerland. Any dispute between the parties that is not subject to arbitration will be resolved in Zug, Switzerland.',
                },
            ],
        },
        {
            id: 'corrections',
            title: 'Corrections',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'There may be information on the Site that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Site at any time, without prior notice. The Foundation does not warrant that the content will be uninterrupted or error free or free of computer viruses, contaminants or other harmful items.',
                },
            ],
        },
        {
            id: 'disclaimer',
            title: 'Disclaimer',
            blocks: [
                {
                    type: 'notice',
                    text: 'THE SITE AND SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE FOUNDATION WILL NOT BE LIABLE FOR ANY DAMAGES OF ANY KIND ARISING FROM THE USE OF THE SITE OR SERVICE, INCLUDING, BUT NOT LIMITED TO INDIRECT, INCIDENTAL, PUNITIVE, EXEMPLARY, SPECIAL OR CONSEQUENTIAL DAMAGES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
                },
                {
                    type: 'paragraph',
                    text: 'You agree that your use of the Site and Service will be at your sole risk. The Foundation is not responsible for any damages or losses that result from your use of the Service, including, but not limited to, your use or inability to use the Service; any changes to or inaccessibility or termination of the Service; any delay, failure, unauthorized access to, or alteration of any transmission or data; any transaction or agreement entered into through the Service; any activities or communications of third parties; or any data or material from a third person accessed on or through the Services.',
                },
                {
                    type: 'paragraph',
                    text: "We make no warranties or representations about the accuracy or completeness of the Site's content or the content of any websites linked to the Site and we will assume no liability or responsibility for any errors, mistakes, inaccuracies, personal injury, property damage, unauthorized access to or use of our secure servers, interruption or cessation of transmission, bugs, viruses, Trojan horses, errors, omissions, loss, or damage incurred as a result of use of any content posted, transmitted, or otherwise made available via the Site.",
                },
                {
                    type: 'paragraph',
                    text: 'If you are dissatisfied with the Service, you agree that your sole and exclusive remedy shall be for you to discontinue your use of the Service. Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, so the above limitation and exclusions may not apply to you.',
                },
                {
                    type: 'paragraph',
                    text: 'The Foundation may link to products and services offered by third parties through the Service. These third-party products and services are not offered by the Foundation and the Foundation is not responsible for any damages or losses that you might incur as a result of your use or purchase of these products and services.',
                },
                {
                    type: 'paragraph',
                    text: 'You shall and hereby do waive California Civil Code Section 1542 or any other similar law of any jurisdiction. Some jurisdictions do not allow the exclusion of implied warranties, so the above exclusion may not apply to you. You may have other rights which vary from jurisdiction to jurisdiction.',
                },
            ],
        },
        {
            id: 'indemnification',
            title: 'Indemnification',
            blocks: [
                {
                    type: 'paragraph',
                    text: "You hereby agree to defend, indemnify, and hold the Foundation harmless from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) use of the Service; (2) breach of this EULA; (3) any breach of your representations and warranties set forth in this EULA; (4) your violation of the rights of a third party, including but not limited to intellectual property rights; (5) any overt harmful act toward any other user of the Service with whom you connected via the Service; or (6) any breach of, or failure to comply with, applicable law.",
                },
                {
                    type: 'paragraph',
                    text: 'Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.',
                },
            ],
        },
        {
            id: 'modifying-and-terminating',
            title: 'Modifying and Terminating Our Service',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'We reserve the right to modify our Service or to suspend or stop providing all or portions of our Service at any time. You also have the right to stop using our Service at any time. We are not responsible for any loss or harm related to your inability to access or use our Service.',
                },
            ],
        },
        {
            id: 'user-data',
            title: 'User Data',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'We will maintain certain data that you transmit to the Site for the purpose of managing the performance of the Site, as well as data relating to your use of the Site. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Site. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.',
                },
            ],
        },
        {
            id: 'electronic-communications',
            title: 'Electronic Communications, Transactions, and Signatures',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'You agree and consent to receive disclosures and communications from us regarding our services, including, but not limited to:',
                },
                {
                    type: 'list',
                    items: [
                        'Terms and conditions of service, and amendments thereto.',
                        'Privacy policies and notices, and amendments thereto.',
                        'Client agreements and receipts.',
                        'Legal and regulatory disclosures and communications.',
                        'Customer service communications.',
                    ],
                },
                {
                    type: 'paragraph',
                    text: 'We may provide Communications to you by email or by making them accessible on the Site or through email, including via hyperlinks provided online and in emails. We may always, in our sole discretion, provide you with any Communication via paper.',
                },
                {
                    type: 'paragraph',
                    text: 'Visiting the Site, sending us emails, and completing online forms constitute Communications. You consent to receive Communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Site, satisfy any legal requirement that such communication be in writing.',
                },
                {
                    type: 'notice',
                    text: 'YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SITE.',
                },
                {
                    type: 'subheading',
                    text: 'Withdrawal of Consent',
                },
                {
                    type: 'paragraph',
                    text: 'You may withdraw your consent to receive Communications under this EULA by contacting us at operations@solana.foundation. We will process your request to withdraw your consent to receive electronic Communications in a reasonable time. After we process your request, your access and use of the Service will terminate.',
                },
                {
                    type: 'subheading',
                    text: 'Requesting Paper Copies',
                },
                {
                    type: 'paragraph',
                    text: 'You may request that we mail a paper copy of any electronic Communication by contacting us at operations@solana.foundation. We may charge you fees associated with processing and mailing your request. We will send a copy of the Communication to you within a reasonable timeframe.',
                },
                {
                    type: 'subheading',
                    text: 'Termination and Changes',
                },
                {
                    type: 'paragraph',
                    text: 'We reserve the right, in our sole discretion, to discontinue the provision of your Communications, or to terminate or change the terms and conditions on which we provide Communications. We will provide you with notice of any such termination or change as required by law.',
                },
            ],
        },
        {
            id: 'california-users',
            title: 'California Users and Residents',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.',
                },
            ],
        },
        {
            id: 'miscellaneous',
            title: 'Miscellaneous',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'This EULA and any policies or operating rules posted by us on the Site or in respect to the Service constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of this EULA shall not operate as a waiver of such right or provision. This EULA operates to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time.',
                },
                {
                    type: 'paragraph',
                    text: 'We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of this EULA is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from this EULA and does not affect the validity and enforceability of any remaining provisions.',
                },
                {
                    type: 'paragraph',
                    text: 'There is no joint venture, partnership, employment or agency relationship created between you and us as a result of this EULA or use of the Service. You agree that this EULA will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of this EULA and the lack of signing by the parties hereto to execute this EULA.',
                },
            ],
        },
        {
            id: 'contact-us',
            title: 'Contact Us',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'In order to resolve a complaint regarding the Site or to receive further information regarding use of the Service, please contact us at operations@solana.foundation.',
                },
            ],
        },
    ],
};

export const privacyPolicyDocument: LegalDocument = {
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    lastUpdated: 'October 11, 2023',
    intro: [
        'This privacy policy ("Privacy Policy") explains how Solana Foundation ("Solana," "our," "we," or "us") collects, uses, and discloses information about you. This Privacy Policy applies when you use www.solana.com (the "Website"), contact our customer service team, engage with us on social media, or otherwise interact with us.',
        'We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of this policy and, in some cases, we may provide you with additional notice, such as adding a statement to our Website or sending you a notification. We encourage you to review this Privacy Policy regularly to stay informed about our information practices and the choices available to you.',
    ],
    sections: [
        {
            id: 'collection-of-information',
            title: 'Collection of Information',
            blocks: [
                {
                    type: 'subheading',
                    text: 'Information You Provide to Us',
                },
                {
                    type: 'paragraph',
                    text: 'We collect information you provide directly to us. For example, you share information directly with us when you fill out a form, make a purchase, communicate with us via third-party platforms, participate in a contest or promotion, request customer support, or otherwise communicate with us. The types of personal information we may collect include your name, email address, postal address, phone number, credit card and other payment information, and any other information you choose to provide.',
                },
                {
                    type: 'subheading',
                    text: 'Information We Collect Automatically When You Interact with Us',
                },
                {
                    type: 'paragraph',
                    text: 'When you access or use our Website or otherwise transact business with us, we automatically collect certain information, including:',
                },
                {
                    type: 'subheading',
                    text: 'Transactional Information',
                },
                {
                    type: 'paragraph',
                    text: 'When you make a purchase or return, we collect information about the transaction, such as product details, purchase price, and the date and location of the transaction.',
                },
                {
                    type: 'subheading',
                    text: 'Device and Usage Information',
                },
                {
                    type: 'paragraph',
                    text: 'We collect information about how you access our Website, including data about the device and network you use, such as your hardware model, operating system version, mobile network, IP address, unique device identifiers, browser type, and app version. We also collect information about your activity on our Website, such as access times, pages viewed, links clicked, and the page you visited before navigating to our Website.',
                },
                {
                    type: 'subheading',
                    text: 'Location Information',
                },
                {
                    type: 'paragraph',
                    text: 'In accordance with your device permissions, we may collect information about the precise location of your device. You may stop the collection of precise location information at any time. See the Your Choices section below for details.',
                },
                {
                    type: 'subheading',
                    text: 'Information Collected by Cookies and Similar Tracking Technologies',
                },
                {
                    type: 'paragraph',
                    text: 'We and our service providers use tracking technologies, such as cookies and web beacons, to collect information about you. Cookies are small data files stored on your hard drive or in device memory that help us improve our Website and your experience, see which areas and features of our Website are popular, and count visits. Web beacons, also known as "pixel tags" or "clear GIFs," are electronic images that we use on our Website and in our emails to help deliver cookies, count visits, and understand usage and campaign effectiveness. For more information about cookies and how to disable them, see the Your Choices section below.',
                },
                {
                    type: 'subheading',
                    text: 'Information We Collect from Other Sources',
                },
                {
                    type: 'paragraph',
                    text: 'We obtain information from third-party sources. For example, we may collect information about you from identity verification services, data analytics providers, and mailing list providers, if applicable.',
                },
            ],
        },
        {
            id: 'use-of-information',
            title: 'Use of Information',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'We use the information we collect to:',
                },
                {
                    type: 'list',
                    items: [
                        'Provide, maintain, and improve our products and services.',
                        'Process transactions and send you related information, including confirmations, receipts, invoices, customer experience surveys, and recall notices.',
                        'Personalize and improve your experience on our Website.',
                        'Send you technical notices, security alerts, and support and administrative messages.',
                        'Respond to your comments and questions and provide customer service.',
                        'Communicate with you about products, services, and events offered by Solana and others and provide news and information that we think will interest you. See the Your Choices section below for information about how to opt out of these communications at any time.',
                        'Monitor and analyze trends, usage, and activities in connection with our Website.',
                        'Facilitate contests, sweepstakes, and promotions and process and deliver entries and rewards.',
                        'Detect, investigate, and prevent security incidents and other malicious, deceptive, fraudulent, or illegal activity and protect the rights and property of Solana and others.',
                        'Debug to identify and repair errors in our Website.',
                        'Comply with our legal and financial obligations.',
                        'Carry out any other purpose described to you at the time the information was collected.',
                    ],
                },
            ],
        },
        {
            id: 'sharing-of-information',
            title: 'Sharing of Information',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'We share personal information in the following circumstances or as otherwise described in this policy:',
                },
                {
                    type: 'list',
                    items: [
                        'We share personal information with vendors, service providers, and consultants that need access to personal information in order to perform services for us, such as companies that assist us with web hosting, shipping and delivery, payment processing, fraud prevention, customer service, data analytics and marketing and advertising.',
                        'We may disclose personal information if we believe that disclosure is in accordance with, or required by, any applicable law or legal process, including lawful requests by public authorities to meet national security or law enforcement requirements.',
                        'We may share personal information if we believe that your actions are inconsistent with our user agreements or policies, if we believe that you have violated the law, or if we believe it is necessary to protect the rights, property, and safety of Solana, our users, the public, or others.',
                        'We share personal information with our lawyers and other professional advisors where necessary to obtain advice or otherwise protect and manage our business interests.',
                        'We may share personal information in connection with, or during negotiations concerning, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company.',
                        'We share personal information with your consent or at your direction.',
                    ],
                },
                {
                    type: 'paragraph',
                    text: 'We may also share aggregated or de-identified information that cannot reasonably be used to identify you.',
                },
            ],
        },
        {
            id: 'analytics',
            title: 'Analytics',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'We allow others to provide analytics services on our behalf across the web and in mobile apps. These entities may use cookies, web beacons, device identifiers, and other technologies to collect information about your use of our Website and other websites and applications, including your IP address, web browser, mobile network information, pages viewed, time spent on pages or in mobile apps, links clicked, and conversion information.',
                },
                {
                    type: 'paragraph',
                    text: 'This information may be used by Solana and others to, among other things, research, analyze and track data, determine the popularity of certain content, and better understand your online activity. However, if you have deleted and disabled cookies, these uses will not be possible to the extent they are based on cookie information. We use Google Analytics to analyze traffic. You can find out more information about Google Analytics cookies by visiting https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage. To opt out of Google Analytics relating to your use of our site, you can download and install the Browser Plugin available at https://tools.google.com/dlpage/gaoptout?hl=en.',
                },
            ],
        },
        {
            id: 'international-transfers',
            title: 'Transfer of Information to the United States and Other Countries',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'Solana operates and engages service providers in various jurisdictions. Therefore, we and our service providers may transfer your personal information to, or store or access it in, jurisdictions that may not provide levels of data protection that are equivalent to those of your home jurisdiction. By using our site, you acknowledge and agree to such transfers and processing, including to and in the United States. We will take steps to ensure that your personal information receives an adequate level of protection in the jurisdictions in which we process it.',
                },
            ],
        },
        {
            id: 'your-choices',
            title: 'Your Choices',
            blocks: [
                {
                    type: 'subheading',
                    text: 'Cookies',
                },
                {
                    type: 'paragraph',
                    text: 'Most browsers are set to accept cookies by default. If you prefer, you can usually set your browser to disable cookies, or to alert you when cookies are being sent. Likewise, most mobile devices allow you to disable the ability for geolocation information to be collected from your mobile device. The help function on most browsers and mobile devices contains instructions on how to set your browser to notify you before accepting cookies, disable cookies entirely, or disable the collection of geolocation data. You need to set each browser, on each device you use to surf the Web. Thus, if you use multiple browsers, such as Chrome, Safari, Internet Explorer, Firefox, and others, you should repeat this procedure with each one. Similarly, if you connect to the Web from multiple devices, such as work and home, you need to set each browser on each device. Depending on your jurisdiction, you may be able to utilize additional cookie management tools. Please note that removing or rejecting cookies could affect the availability and functionality of our Website.',
                },
                {
                    type: 'subheading',
                    text: 'Communications Preferences',
                },
                {
                    type: 'paragraph',
                    text: 'You may opt out of receiving newsletters from Solana by following the instructions in those communications.',
                },
            ],
        },
        {
            id: 'california-rights',
            title: 'Your California Privacy Rights',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'The California Consumer Privacy Act or "CCPA" (Cal. Civ. Code 1798.100 et seq.) affords consumers residing in California certain rights with respect to their personal information. If you are a California resident, this section applies to you.',
                },
                {
                    type: 'subheading',
                    text: 'California Consumer Privacy Act',
                },
                {
                    type: 'paragraph',
                    text: 'In the preceding 12 months, we have collected the following categories of personal information: identifiers, financial information, biometric information, internet or electric network activity information, and geolocation data. For details about the precise data points we collect and the categories of sources of such collection, please see the Collection of Information section above. We collect personal information for the business and commercial purposes described in the Use of Information section above.',
                },
                {
                    type: 'paragraph',
                    text: 'In the preceding 12 months, we have disclosed the following categories of personal information for business purposes to the following categories of recipients:',
                },
                {
                    type: 'subheading',
                    text: 'Category of Personal Information',
                },
                {
                    type: 'list',
                    items: ['Financial Information'],
                },
                {
                    type: 'subheading',
                    text: 'Categories of Recipients',
                },
                {
                    type: 'list',
                    items: ['Payment provider', 'Third-party logistics providers'],
                },
                {
                    type: 'paragraph',
                    text: 'Solana does not sell your personal information.',
                },
                {
                    type: 'paragraph',
                    text: 'Subject to certain limitations, you have the right to (1) request to know more about the categories and specific pieces of personal information we collect, use, and disclose, (2) request deletion of your personal information, and (3) not be discriminated against for exercising these rights. You may make these requests by contacting us at operations@solana.com. We will verify your request by asking you to provide information related to your recent interactions with us. We will not discriminate against you if you exercise your rights under the CCPA.',
                },
            ],
        },
        {
            id: 'european-disclosures',
            title: 'Additional Disclosures for Individuals in Europe',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'If you are located in the European Economic Area ("EEA"), the United Kingdom, or Switzerland, you have certain rights and protections under the law regarding the processing of your personal data, and this section applies to you.',
                },
                {
                    type: 'subheading',
                    text: 'Legal Basis for Processing',
                },
                {
                    type: 'paragraph',
                    text: 'When we process your personal data, we will do so in reliance on the following lawful bases:',
                },
                {
                    type: 'list',
                    items: [
                        'To perform our responsibilities under our contract with you, such as processing payments for and providing the products and services you requested.',
                        'When we have a legitimate interest in processing your personal data to operate our business or protect our interests, such as to provide, maintain, and improve our products and services, conduct data analytics, and communicate with you.',
                        'To comply with our legal obligations, such as to maintain a record of your consents and track those who have opted out of communications.',
                        'When we have your consent to do so, such as when you opt in to receive communications from us. When consent is the legal basis for our processing your personal data, you may withdraw such consent at any time.',
                    ],
                },
                {
                    type: 'subheading',
                    text: 'Data Retention',
                },
                {
                    type: 'paragraph',
                    text: 'We store other personal data for as long as necessary to carry out the purposes for which we originally collected it and for other legitimate business purposes, including to meet our legal, regulatory, or other compliance obligations.',
                },
                {
                    type: 'subheading',
                    text: 'Data Subject Requests',
                },
                {
                    type: 'paragraph',
                    text: 'Subject to certain limitations, you have the right to request access to the personal data we hold about you and to receive your data in a portable format, the right to ask that your personal data be corrected or erased, and the right to object to, or request that we restrict, certain processing. If you would like to exercise any of these rights, please contact us at operations@solana.com.',
                },
                {
                    type: 'subheading',
                    text: 'Questions or Complaints',
                },
                {
                    type: 'paragraph',
                    text: 'If you have a concern about our processing of personal data that we are not able to resolve, you have the right to lodge a complaint with the Data Protection Authority where you reside. Contact details for your Data Protection Authority can be found using the links below:',
                },
                {
                    type: 'list',
                    items: [
                        'For individuals in the EEA: https://edpb.europa.eu/about-edpb/board/members_en',
                        'For individuals in the UK: https://ico.org.uk/global/contact-us/',
                        'For individuals in Switzerland: https://www.edoeb.admin.ch/edoeb/en/home/the-fdpic/contact.html',
                    ],
                },
            ],
        },
        {
            id: 'contact-us',
            title: 'Contact Us',
            blocks: [
                {
                    type: 'paragraph',
                    text: 'If you have any questions about this Privacy Policy, please contact us at operations@solana.com.',
                },
            ],
        },
    ],
};
