import React from "react";
import "./Disclaimer.css";

export default function Disclaimer() {
  return (
    <div className="legal legal--disclaimer">
      <header className="legal__header">
        <h1 className="legal__title">Disclaimer</h1>
        <p className="legal__last-updated">Last Updated: 21 September 2025</p>
      </header>

      {/* English Section */}
      <section className="legal__section legal__section--en">
        <p className="legal__text">
          The information provided by <strong>GyaanManthan</strong> is for
          general informational purposes only. All content on this platform is
          user-generated.
        </p>

        <h2 className="legal__subtitle">1. No Guarantees of Accuracy</h2>
        <p className="legal__text">
          While we encourage our creators to share accurate and reliable
          information, <strong>GyaanManthan</strong> makes no representation
          or warranty of any kind, express or implied, regarding the accuracy,
          adequacy, validity, reliability, or completeness of any information
          on the site. YOUR USE OF THE SITE AND YOUR RELIANCE ON ANY INFORMATION
          IS SOLELY AT YOUR OWN RISK.
        </p>

        <h2 className="legal__subtitle">2. Views Expressed Are Not Ours</h2>
        <p className="legal__text">
          The opinions, views, and expressions published on the platform belong
          solely to their respective authors. They do not necessarily reflect
          or represent the views, policies, or position of{" "}
          <strong>GyaanManthan</strong> or its team.
        </p>

        <h2 className="legal__subtitle">3. Not Professional Advice</h2>
        <p className="legal__text">
          The content on GyaanManthan is not intended to be a substitute for
          professional advice, including but not limited to, financial, legal,
          or medical advice. Always seek the guidance of a qualified
          professional with any questions you may have. Never disregard
          professional advice because of something you have read on this
-         platform.
        </p>
        
        <h2 className="legal__subtitle">4. External Links</h2>
        <p className="legal__text">
          The platform may contain links to other websites or content belonging to
          or originating from third parties. Such external links are not
          investigated, monitored, or checked for accuracy by us. We do not
          warrant, endorse, guarantee, or assume responsibility for any
          information offered by third-party websites.
        </p>
      </section>

      <div className="legal__divider" role="separator" aria-hidden="true" />

      {/* Hindi Section */}
      <section className="legal__section legal__section--hi">
        <h1 className="legal__title">अस्वीकरण (Disclaimer)</h1>
        <p className="legal__last-updated">अंतिम अपडेट: 21 सितंबर 2025</p>

        <p className="legal__text">
          <strong>ज्ञानमंथन</strong> द्वारा प्रदान की गई जानकारी केवल सामान्य
          सूचना के उद्देश्यों के लिए है। इस प्लेटफ़ॉर्म पर सभी सामग्री
          उपयोगकर्ताओं द्वारा बनाई गई है।
        </p>

        <h2 className="legal__subtitle">1. सटीकता की कोई गारंटी नहीं</h2>
        <p className="legal__text">
          यद्यपि हम अपने क्रिएटर्स को सटीक और विश्वसनीय जानकारी साझा करने के लिए
          प्रोत्साहित करते हैं, लेकिन <strong>ज्ञानमंथन</strong> साइट पर किसी भी
          जानकारी की सटीकता, पर्याप्तता, वैधता, विश्वसनीयता या पूर्णता के संबंध
          में किसी भी प्रकार की कोई वारंटी, व्यक्त या निहित, नहीं देता है। साइट
          का उपयोग और किसी भी जानकारी पर आपका भरोसा पूरी तरह से आपके अपने जोखिम
          पर है।
        </p>

        <h2 className="legal__subtitle">2. व्यक्त किए गए विचार हमारे नहीं हैं</h2>
        <p className="legal__text">
          प्लेटफ़ॉर्म पर प्रकाशित राय, विचार और अभिव्यक्तियाँ पूरी तरह से उनके
          संबंधित लेखकों की हैं। वे आवश्यक रूप से <strong>ज्ञानमंथन</strong> या
          उसकी टीम के विचारों, नीतियों या स्थिति को प्रतिबिंबित या प्रस्तुत नहीं
          करते हैं।
        </p>

        <h2 className="legal__subtitle">3. यह पेशेवर सलाह नहीं है</h2>
        <p className="legal__text">
          ज्ञानमंथन पर मौजूद सामग्री का उद्देश्य पेशेवर सलाह का विकल्प बनना नहीं
          है, जिसमें वित्तीय, कानूनी, या चिकित्सा सलाह शामिल है, लेकिन यह इन्हीं
          तक सीमित नहीं है। आपके किसी भी प्रश्न के लिए हमेशा एक योग्य पेशेवर का
          मार्गदर्शन लें। इस प्लेटफ़ॉर्म पर पढ़ी गई किसी बात के कारण पेशेवर सलाह
          की कभी भी अवहेलना न करें।
        </p>
        
        <h2 className="legal__subtitle">4. बाहरी लिंक</h2>
        <p className="legal__text">
          प्लेटफ़ॉर्म पर अन्य वेबसाइटों के लिंक या तीसरे पक्ष से संबंधित सामग्री
          हो सकती है। ऐसे बाहरी लिंक की सटीकता की हमारे द्वारा जाँच, निगरानी या
          पड़ताल नहीं की जाती है। हम तीसरे पक्ष की वेबसाइटों द्वारा दी गई किसी भी
          जानकारी के लिए कोई वारंटी, समर्थन, गारंटी या ज़िम्मेदारी नहीं लेते हैं।
        </p>
      </section>
    </div>
  );
}