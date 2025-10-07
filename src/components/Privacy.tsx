import React from "react";
import "./Privacy.css";

export default function Privacy() {
  return (
    <div className="legal legal--privacy">
      <header className="legal__header">
        <h1 className="legal__title">Privacy Policy</h1>
        <p className="legal__last-updated">Last Updated: 21 September 2025</p>
      </header>

      {/* English Section */}
      <section className="legal__section legal__section--en">
        <p className="legal__text">
          Welcome to <strong>GyaanManthan</strong>. We are deeply committed to
          protecting your personal data and respecting your privacy. This
          policy outlines how we collect, use, and safeguard your information.
        </p>

        <h2 className="legal__subtitle">1. Information We Collect</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            <strong>Personal Identification Information:</strong> We may collect
            your name and email address when you register, comment, or contact
            us.
          </li>
          <li className="legal__list-item">
            <strong>Non-Personal Information:</strong> We automatically collect
            non-personal data like browser type, device information, and usage
            patterns to analyze trends and improve our service.
          </li>
        </ul>

        <h2 className="legal__subtitle">2. How We Use Your Information</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            To operate, maintain, and personalize your experience on the
            Platform.
          </li>
          <li className="legal__list-item">
            To manage your account and provide you with customer support.
          </li>
          <li className="legal__list-item">
            To communicate with you about updates, security alerts, and support
            messages.
          </li>
          <li className="legal__list-item">
            Your personal information is never sold, leased, or shared with
            third-party marketers.
          </li>
        </ul>

        <h2 className="legal__subtitle">3. Data Security & User Content</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            We implement robust security measures to protect your data from
            unauthorized access or disclosure. However, no digital transmission
            is 100% secure.
          </li>
          <li className="legal__list-item">
            Responsibility for user-generated content (posts, comments) rests
            entirely with the individual author. The platform does not endorse
            or assume liability for such material.
          </li>
        </ul>
        
        <h2 className="legal__subtitle">4. Your Rights & Choices</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            You have the right to access, update, or request the deletion of your
            personal data by contacting us.
          </li>
          <li className="legal__list-item">
            We reserve the right to update this policy. We will notify users of
            significant changes.
          </li>
        </ul>

        <h2 className="legal__subtitle">5. Legal Compliance</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            We operate in full accordance with the Indian Information
            Technology (IT) Act, its amendments, MSME guidelines, and all other
            applicable national and state regulations.
          </li>
          <li className="legal__list-item">
            For any questions or concerns regarding this policy, please contact our
            Data Protection Officer at:{" "}
            <a href="mailto:gyanamksham74@gmail.com" className="legal__link">
              gyanamksham74@gmail.com
            </a>
          </li>
        </ul>
      </section>

      <div className="legal__divider" role="separator" aria-hidden="true" />

      {/* Hindi Section */}
      <section className="legal__section legal__section--hi">
        <h1 className="legal__title">गोपनीयता नीति</h1>
        <p className="legal__last-updated">अंतिम अपडेट: 21 सितंबर 2025</p>

        <p className="legal__text">
          <strong>ज्ञानमंथन</strong> में आपका स्वागत है। हम आपके व्यक्तिगत डेटा की
          सुरक्षा और आपकी गोपनीयता का सम्मान करने के लिए पूरी तरह से प्रतिबद्ध
          हैं। यह नीति बताती है कि हम आपकी जानकारी को कैसे एकत्र, उपयोग और
          सुरक्षित करते हैं।
        </p>

        <h2 className="legal__subtitle">1. हम कौन-सी जानकारी एकत्र करते हैं</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            <strong>व्यक्तिगत पहचान जानकारी:</strong> जब आप पंजीकरण, टिप्पणी या
            हमसे संपर्क करते हैं तो हम आपका नाम और ईमेल पता एकत्र कर सकते हैं।
          </li>
          <li className="legal__list-item">
            <strong>गैर-व्यक्तिगत जानकारी:</strong> हम सेवा में सुधार और रुझानों का
            विश्लेषण करने के लिए ब्राउज़र प्रकार, डिवाइस की जानकारी और उपयोग पैटर्न
            जैसे गैर-व्यक्तिगत डेटा स्वचालित रूप से एकत्र करते हैं।
          </li>
        </ul>

        <h2 className="legal__subtitle">2. हम आपकी जानकारी का उपयोग कैसे करते हैं</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            प्लेटफ़ॉर्म पर आपके अनुभव को संचालित करने, बनाए रखने और व्यक्तिगत
            करने के लिए।
          </li>
          <li className="legal__list-item">
            आपका खाता प्रबंधित करने और आपको ग्राहक सहायता प्रदान करने के लिए।
          </li>
          <li className="legal__list-item">
            आपको अपडेट, सुरक्षा अलर्ट और समर्थन संदेशों के बारे में सूचित करने के
            लिए।
          </li>
          <li className="legal__list-item">
            आपकी व्यक्तिगत जानकारी कभी भी तीसरे पक्ष के विपणक (Marketers) को बेची,
            किराए पर या साझा नहीं की जाती है।
          </li>
        </ul>

        <h2 className="legal__subtitle">3. डेटा सुरक्षा और उपयोगकर्ता सामग्री</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            हम आपके डेटा को अनधिकृत पहुँच या खुलासे से बचाने के लिए मज़बूत सुरक्षा
            उपाय लागू करते हैं। हालाँकि, कोई भी डिजिटल ट्रांसमिशन 100% सुरक्षित
            नहीं है।
          </li>
          <li className="legal__list-item">
            उपयोगकर्ताओं द्वारा बनाई गई सामग्री (पोस्ट, टिप्पणियाँ) की ज़िम्मेदारी
            पूरी तरह से संबंधित लेखक की होती है। प्लेटफ़ॉर्म ऐसी सामग्री का समर्थन
            नहीं करता और न ही उसकी ज़िम्मेदारी लेता है।
          </li>
        </ul>
        
        <h2 className="legal__subtitle">4. आपके अधिकार और विकल्प</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            आपको हमसे संपर्क करके अपने व्यक्तिगत डेटा तक पहुँचने, उसे अपडेट करने या
            उसे हटाने का अनुरोध करने का अधिकार है।
          </li>
          <li className="legal__list-item">
            हम इस नीति को अपडेट करने का अधिकार सुरक्षित रखते हैं। महत्वपूर्ण
            बदलावों के बारे में उपयोगकर्ताओं को सूचित किया जाएगा।
          </li>
        </ul>
        
        <h2 className="legal__subtitle">5. कानूनी अनुपालन</h2>
        <ul className="legal__list">
          <li className="legal__list-item">
            हम भारतीय सूचना प्रौद्योगिकी (IT) अधिनियम, इसके संशोधनों, MSME
            दिशानिर्देशों और अन्य सभी लागू राष्ट्रीय और राज्य नियमों का पूरी
            तरह से पालन करते हैं।
          </li>
          <li className="legal__list-item">
            इस नीति के संबंध में किसी भी प्रश्न या चिंता के लिए, कृपया हमारे डेटा
            संरक्षण अधिकारी से संपर्क करें:{" "}
            <a href="mailto:gyanamksham74@gmail.com" className="legal__link">
              info@gyaanmanthan.in
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}