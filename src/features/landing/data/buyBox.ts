export type BuyBoxItem = {
  asset: string;
  title: string;
  points: string[];
};

export const buyBox: BuyBoxItem[] = [
{
  asset: 'Mobile Home Park',
  title: 'Mobile Home Parks',
  points: ['20+ sites preferred', 'Park-owned or tenant-owned mix', 'Value-add & turnarounds welcome']
},
{
  asset: 'RV Park',
  title: 'RV Parks',
  points: ['Annual or seasonal tenant base', 'Expansion land a plus', 'On-market or off-market']
},
{
  asset: 'Multifamily / Apartment',
  title: 'Multifamily / Apartments',
  points: ['10–100+ units', 'Stabilized or value-add', 'Tenants in place is fine']
},
{
  asset: 'SFH Portfolio',
  title: 'Single-Family Portfolios',
  points: ['3+ homes, package pricing', 'Tenanted or vacant', 'One buyer, one closing']
},
{
  asset: 'Single-Family Home',
  title: 'Single-Family Homes',
  points: ['Any condition — distressed OK', 'Inherited, tired-landlord, vacant', 'Fast, as-is close']
},
{
  asset: 'Care Facility (ALF / Sober Living / Care)',
  title: 'Care Facilities',
  points: ['Assisted living & sober living', 'Mental health & care facilities', 'Licensed or license-ready']
}];


export const structures = [
{
  tag: 'Seller Financing',
  title: 'Long-Term Passive Income',
  desc: 'We structure terms that give you steady monthly income and real tax benefits — often at or above your asking price.'
},
{
  tag: 'Subject-To',
  title: 'We Take Over the Debt',
  desc: 'Taking over existing payments lets us close fast — no new bank origination, no financing contingency delays.'
},
{
  tag: 'Hybrid',
  title: 'Wraps & 2nd Positions',
  desc: "Combining multiple financing methods to bridge the gap and hit your number when a single structure won't."
},
{
  tag: 'Capital Flexibility',
  title: 'Up to 50% Down',
  desc: 'When the structure calls for it, we can bring significant capital to close — and we close on your timeline.'
}];


export const processSteps = [
{
  title: 'Submit Your Deal',
  desc: 'Send the property details and any docs you have through the form below.'
},
{
  title: 'Same-Day Response',
  desc: 'We confirm receipt and flag anything else we need — same day.'
},
{
  title: '24-Hour Underwrite',
  desc: 'Our team reviews the numbers within 24 hours.'
},
{
  title: 'LOI & Structure Call',
  desc: "If it's a fit, we present a formal Letter of Intent and schedule a call to discuss structure."
}];