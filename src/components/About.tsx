import React from "react";
import "./About.css";

export default function About() {
  return (
    <div className="legal legal--about">
      <header className="legal__header">
        <h1 className="legal__title">About GyaanManthan</h1>
      </header>

      {/* English Section */}
      <section className="legal__section legal__section--en">
        <p className="legal__text">
          <strong>GyaanManthan</strong> is more than just a platform; it's a
          movement to democratize knowledge and empower creators. We are a
          passionate team dedicated to building an ecosystem where wisdom flows
          freely and authentically.
        </p>

        <h2 className="legal__subtitle">Our Mission</h2>
        <p className="legal__text">
          Our mission is to build a vibrant community where creators can share
          their expertise with the world, and learners can discover rich,
          culturally relevant knowledge without barriers. We aim to make
          learning smarter, more engaging, and deeply connected to its roots.
        </p>

        <h2 className="legal__subtitle">What Makes Us Different?</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            <strong>Creator-First Approach:</strong> We provide our creators
            with powerful tools, fair monetization opportunities, and a
            supportive environment to grow.
          </li>
          <li className="legal__list-item">
            <strong>Cultural Relevance:</strong> We believe knowledge is most
            impactful when it resonates with its audience. We champion content
            that is diverse, inclusive, and culturally rich.
          </li>
          <li className="legal__list-item">
            <strong>Trust & Technology:</strong> Built on a foundation of
            trust, we use technology to ensure data privacy, content integrity,
            and a seamless experience for every user.
          </li>
        </ul>

        <h2 className="legal__subtitle">Our Commitment</h2>
        <p className="legal__text">
          We are a proudly Indian platform, officially registered as a{" "}
          <strong>Micro Enterprise (MSME)</strong> under Udyam Registration
          No. <strong>UDYAM-UP-43-0159324</strong>. This is not just a
          registration number; it's our commitment to contributing to India's
          digital growth with integrity and a future-ready mindset.
        </p>
      </section>

      <div className="legal__divider" role="separator" aria-hidden="true" />

      {/* Hindi Section */}
      <section className="legal__section legal__section--hi">
        <h1 className="legal__title">ज्ञानमंथन के बारे में</h1>
        <p className="legal__text">
          <strong>ज्ञानमंथन</strong> सिर्फ एक प्लेटफ़ॉर्म नहीं है; यह ज्ञान को
          लोकतांत्रिक बनाने और क्रिएटर्स को सशक्त बनाने का एक आंदोलन है। हम एक
          जुनूनी टीम हैं जो एक ऐसा इकोसिस्टम बनाने के लिए समर्पित है जहाँ ज्ञान
          स्वतंत्र और प्रामाणिक रूप से प्रवाहित हो।
        </p>

        <h2 className="legal__subtitle">हमारा मिशन</h2>
        <p className="legal__text">
          हमारा मिशन एक ऐसा जीवंत समुदाय बनाना है जहाँ क्रिएटर्स अपनी विशेषज्ञता
          दुनिया के साथ साझा कर सकें, और सीखने वाले बिना किसी बाधा के समृद्ध और
          सांस्कृतिक रूप से प्रासंगिक ज्ञान की खोज कर सकें। हमारा लक्ष्य सीखने
          को स्मार्ट, अधिक आकर्षक और अपनी जड़ों से गहराई से जुड़ा हुआ बनाना है।
        </p>

        <h2 className="legal__subtitle">हम अलग क्यों हैं?</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            <strong>क्रिएटर-प्रथम दृष्टिकोण:</strong> हम अपने क्रिएटर्स को आगे
            बढ़ने के लिए शक्तिशाली उपकरण, उचित मुद्रीकरण के अवसर और एक सहायक
            वातावरण प्रदान करते हैं।
          </li>
          <li className="legal__list-item">
            <strong>सांस्कृतिक प्रासंगिकता:</strong> हमारा मानना है कि ज्ञान तब
            सबसे ज़्यादा प्रभावशाली होता है जब वह अपने दर्शकों के साथ जुड़ता है।
            हम विविध, समावेशी और सांस्कृतिक रूप से समृद्ध सामग्री को बढ़ावा
            देते हैं।
          </li>
          <li className="legal__list-item">
            <strong>भरोसा और तकनीक:</strong> भरोसे की नींव पर निर्मित, हम हर
            उपयोगकर्ता के लिए डेटा गोपनीयता, सामग्री की अखंडता और एक सहज अनुभव
            सुनिश्चित करने के लिए तकनीक का उपयोग करते हैं।
          </li>
        </ul>

        <h2 className="legal__subtitle">हमारी प्रतिबद्धता</h2>
        <p className="legal__text">
          हम गर्व से एक भारतीय प्लेटफ़ॉर्म हैं, जो उद्यम पंजीकरण संख्या{" "}
          <strong>UDYAM-UP-43-0159324</strong> के तहत आधिकारिक तौर पर एक{" "}
          <strong>सूक्ष्म उद्यम (MSME)</strong> के रूप में पंजीकृत है। यह सिर्फ
          एक पंजीकरण संख्या नहीं है; यह ईमानदारी और भविष्य के लिए तैयार मानसिकता
          के साथ भारत के डिजिटल विकास में योगदान करने की हमारी प्रतिबद्धता है।
        </p>
      </section>
    </div>
  );
}