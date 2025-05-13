export default function Footer() {
    return (
      <footer className="bg-black text-white py-8 px-6 mt-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-bold mb-2">Info</h4>
            <ul>
              <li>Shipping Info</li>
              <li>Returns</li>
              <li>FAQs</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">About Us</h4>
            <ul>
              <li>Company</li>
              <li>Careers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">Product</h4>
            <ul>
              <li>New Arrivals</li>
              <li>Best Sellers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">Social</h4>
            <ul>
              <li>Instagram</li>
              <li>Facebook</li>
              <li>Twitter</li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }
  