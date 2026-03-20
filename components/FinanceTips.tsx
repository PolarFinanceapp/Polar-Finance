import { Ionicons } from'@expo/vector-icons';
import { useRef, useState } from'react';
import { Animated, TouchableOpacity, View, Text } from'react-native';
import { useTheme } from'../context/ThemeContext';

const TIPS = [
 // Saving
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Build a 3-month emergency fund first', body:'Before investing or paying off low-interest debt, save 3 months of living expenses in an easy-access account. This stops you going into debt when the unexpected hits.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Pay yourself first', body:'Set up an automatic transfer to savings on payday - before you have a chance to spend it. Even £50/month adds up to £600 a year, plus interest.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Use a high-interest easy-access account', body:'Many banks offer 4-5% interest on easy-access savings. Check MoneySavingExpert regularly - rates change often and you could be missing out.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Round-up saving adds up fast', body:'Apps that round up purchases to the nearest pound can save £30-50/month passively. Small amounts compound significantly over time.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'The 24-hour rule for impulse buys', body:'Before any non-essential purchase over £30, wait 24 hours. Most impulse urges disappear. This alone can save hundreds per year.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Automate savings increases yearly', body:'Every time you get a pay rise, increase your savings rate by half the raise. You still take home more money but your savings accelerate dramatically.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Keep savings in a separate bank', body:'Keeping savings in a different bank to your current account creates friction that prevents impulse withdrawals. Out of sight, out of mind.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Track your net worth monthly', body:'What gets measured gets managed. Tracking your net worth monthly - assets minus debts - keeps you motivated and shows real progress over time.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Spend what is left, not save what is left', body:'Reverse the order: allocate money to savings, bills, and goals first. Only spend what remains. This single habit transforms financial behaviour.' },
 { cat:'Saving', icon:'wallet', color:'#00D4AA', title:'Audit subscriptions every 6 months', body:'The average person pays for 4-5 subscriptions they rarely use. A quick audit could free up £30-80/month - that\'s £360-960/year.' },

 // Budgeting
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Try the 50/30/20 rule', body:'50% of take-home pay on needs, 30% on wants, 20% on savings and debt repayment. It\'s a simple starting framework you can adjust to your situation.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Zero-based budgeting gives every pound a job', body:'Assign every pound of income to a category until you reach zero. This prevents lifestyle creep and keeps your spending intentional.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Review last month\'s spending honestly', body:'Most people underestimate spending by 20-40%. Looking at actual bank data - not guesses - reveals where money really goes.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Budget for fun - seriously', body:'A budget that restricts everything fails. Allocate a realistic "fun money" amount. If you stay within it, no guilt - you planned for it.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Annual expenses catch people off guard', body:'Divide yearly costs (insurance, MOT, birthday gifts) by 12 and set that aside monthly. Nothing should be a "surprise" expense.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Food is usually the easiest win', body:'Cooking at home vs eating out can save £200-400/month. Even meal prepping twice a week makes a significant difference to your budget.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Compare unit prices, not shelf prices', body:'Supermarkets display cost per 100g/litre. The cheaper-looking product is often more expensive per unit. Always check the small print.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Cancel and renegotiate every year', body:'Insurance, broadband, mobile - companies save best deals for new customers. Threaten to cancel and you\'ll often get a significant discount.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Your biggest expense is probably housing', body:'If rent or mortgage exceeds 35% of take-home pay, that\'s a red flag. Consider house-sharing, moving, or increasing income as a priority.' },
 { cat:'Budgeting', icon:'pie-chart', color:'#6C63FF', title:'Track cost per use, not just price', body:'A £100 jacket worn 200 times costs 50p/use. A £20 jacket worn twice costs £10/use. Quality items often work out cheaper long-term.' },

 // Investing
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Max your ISA allowance first', body:'The UK ISA allowance is £20,000/year - completely tax-free growth and withdrawals. Use it before taxable accounts. It\'s one of the best wealth-building tools available.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Start investing in your 20s, not your 30s', body:'£200/month invested from age 22 at 7% annual return = £525k by 60. Starting at 32 gives just £245k. Time is your biggest investing asset.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Low-cost index funds beat most fund managers', body:'Over 15+ years, 90% of actively managed funds underperform the index. A global tracker fund with 0.1-0.2% fees usually beats paying 1-2% for a fund manager.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Don\'t try to time the market', body:'"Time in the market beats timing the market." Missing just the 10 best days over 20 years can halve your returns. Stay invested through volatility.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Diversify across geographies', body:'A global index fund like FTSE All-World covers 3,000+ companies across 50+ countries. Single-country portfolios carry unnecessary concentration risk.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Invest regularly, not as a lump sum', body:'Pound-cost averaging - investing the same amount monthly - removes the pressure of "buying at the right time." You buy more shares when prices are low automatically.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Understand what you\'re buying', body:'Never invest in something you can\'t explain simply. Cryptocurrency, meme stocks, and complex products often carry hidden risks that aren\'t obvious at first.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Reinvest dividends automatically', body:'Dividend reinvestment compounds returns significantly. A fund returning 7%/year with dividends reinvested grows far faster than one paying them out as cash.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Your employer pension is free money', body:'If your employer matches pension contributions, not contributing is turning down part of your salary. Always contribute at least enough to get the full match.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Beware investment influencers', body:'People promoting specific stocks, crypto, or schemes on social media often profit from you buying. If the returns sound extraordinary, they usually are not real.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Fees destroy long-term returns', body:'A 1% vs 0.1% annual fee difference on £100k over 30 years = £70,000+ less in your pocket. Platform and fund fees deserve serious attention.' },
 { cat:'Investing', icon:'trending-up', color:'#FFD700', title:'Rebalance your portfolio annually', body:'If stocks rise and bonds fall, your 80/20 split becomes 90/10 - more risk than intended. Annual rebalancing keeps your risk level consistent.' },

 // Credit
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Your credit score affects more than loans', body:'Landlords, mobile phone contracts, and even some employers check credit. A good score opens more doors and gets you better rates on everything.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Pay your credit card in full every month', body:'Credit card interest rates are typically 20-30% APR. Carrying a balance is one of the most expensive financial habits. Pay in full, every month, always.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Register to vote to boost your score', body:'Being on the electoral roll is one of the fastest ways to improve your credit score. It verifies your address and identity for lenders.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Check your credit report for errors', body:'Errors on credit files are more common than people think. Check Experian, Equifax, and TransUnion free via Clearscore or Credit Karma annually.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Don\'t apply for too much credit at once', body:'Each credit application leaves a "hard search" on your file for 12 months. Multiple applications in a short period signal financial stress to lenders.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Keep credit card utilisation below 30%', body:'If your credit limit is £3,000, try to keep your balance below £900. High utilisation - even if paid off - can temporarily lower your score.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'A credit card used wisely builds history', body:'Using a credit card for small purchases and paying in full builds a positive credit history faster than using no credit at all.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Buy Now Pay Later affects your credit', body:'Klarna and similar services now report to credit agencies. Missing a payment can damage your score significantly. Treat BNPL like any other debt.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Consider a 0% balance transfer card', body:'If you carry credit card debt, transferring to a 0% balance transfer card can save hundreds in interest. Use the interest-free period to clear the debt entirely.' },
 { cat:'Credit', icon:'card', color:'#FF9F43', title:'Joint accounts link your credit file', body:'Opening a joint account with someone with poor credit creates a "financial association" that can affect your score. Choose shared finances carefully.' },

 // Tax
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'Use your personal allowance fully', body:'Everyone in the UK can earn £12,570 tax-free. If you\'re earning below this - from a side hustle or investments - you may owe no tax at all.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'Claim working from home tax relief', body:'If your employer requires you to work from home, you can claim £6/week tax relief without receipts. That\'s £312/year for a basic rate taxpayer.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'You have a £1,000 trading allowance', body:'Selling on eBay, Vinted, or doing casual work? The first £1,000 of trading income per year is completely tax-free - no need to register for self assessment.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'ISA profits are always tax-free', body:'Capital gains, dividends, and interest inside an ISA are never taxed - even when withdrawn. This is hugely valuable over decades of compounding growth.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'Pension contributions reduce your tax bill', body:'Money paid into a pension is tax-free. A higher rate taxpayer paying £800 into a pension gets £200 back from HMRC - an instant 25% return.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'You have a capital gains allowance', body:'In 2024/25 you can make £3,000 in capital gains before paying tax. Selling investments in stages across tax years can minimise your CGT bill.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'Marriage allowance can save £252/year', body:'If one partner earns below £12,570 and the other is a basic rate taxpayer, transferring £1,260 of personal allowance saves £252 in tax annually.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'Self-employed? Keep every receipt', body:'Legitimate business expenses reduce your taxable profit. Phone bills, subscriptions, travel, and home office costs all qualify - but you need records.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'Check your tax code is correct', body:'Millions of people are on the wrong tax code and overpay tax. Check your payslip - the standard code is 1257L. Wrong code? Contact HMRC immediately.' },
 { cat:'Tax', icon:'receipt', color:'#FF6B6B', title:'HMRC late filing fine is £100 minimum', body:'Miss the 31 January self assessment deadline and you get an automatic £100 fine - even if you owe no tax. Set a reminder well in advance.' },

 // Property
 { cat:'Property', icon:'home', color:'#a89fff', title:'A Lifetime ISA gives you 25% free', body:'Open a Lifetime ISA before age 40 and the government adds 25% to your savings - up to £1,000/year free - specifically for your first home or retirement.' },
 { cat:'Property', icon:'home', color:'#a89fff', title:'Your deposit size determines your rate', body:'A 10% deposit gets you a mortgage, but a 15% or 20% deposit unlocks significantly better interest rates. Even a 1% rate difference saves thousands.' },
 { cat:'Property', icon:'home', color:'#a89fff', title:'Factor in all buying costs', body:'Beyond the deposit: stamp duty, solicitor fees, survey costs, and moving costs typically add £5,000-15,000 to a property purchase. Budget for all of it.' },
 { cat:'Property', icon:'home', color:'#a89fff', title:'Overpaying mortgage beats most investments', body:'Paying £100/month extra on a £200k mortgage at 4.5% saves around £25,000 in interest and cuts 4 years off your term. Guaranteed tax-free return.' },
 { cat:'Property', icon:'home', color:'#a89fff', title:'Leasehold vs freehold matters enormously', body:'Leasehold properties come with service charges, ground rent, and major works bills. Understand what you\'re buying - leasehold can be an expensive surprise.' },
 { cat:'Property', icon:'home', color:'#a89fff', title:'Fix your mortgage rate before it expires', body:'When your fixed-rate deal ends, you move to the Standard Variable Rate - often 2-3% higher. Start shopping for a new deal 6 months before expiry.' },
 { cat:'Property', icon:'home', color:'#a89fff', title:'Shared ownership is not always cheaper', body:'Buying 25-75% of a property sounds affordable but you still pay rent on the rest plus service charges. Model the total monthly cost carefully.' },
 { cat:'Property', icon:'home', color:'#a89fff', title:'Location affects resale more than the house', body:'School catchment areas, transport links, and local development plans affect future value more than the property itself. Research the area thoroughly.' },

 // Career & Income
 { cat:'Income', icon:'briefcase', color:'#00D4AA', title:'Negotiating salary is expected', body:'Most employers offer below their maximum. Researching market rates and negotiating confidently at job offers typically adds £2,000-5,000/year - with zero extra work.' },
 { cat:'Income', icon:'briefcase', color:'#00D4AA', title:'Your employer NI is part of your cost to company', body:'Employers pay 13.8% NI on your salary. Understanding your total compensation cost strengthens salary negotiations.' },
 { cat:'Income', icon:'briefcase', color:'#00D4AA', title:'Side income has a £1,000 tax-free allowance', body:'The trading allowance means your first £1,000 from freelance work, selling, or tutoring is completely tax-free each tax year.' },
 { cat:'Income', icon:'briefcase', color:'#00D4AA', title:'Upskilling pays the highest returns', body:'A £500 online course that leads to a £5,000 salary increase pays back 10x in year one. Investing in your skills is often better than investing in markets.' },
 { cat:'Income', icon:'briefcase', color:'#00D4AA', title:'Ask for a pay rise every year', body:'Inflation erodes your real salary if you don\'t negotiate. Annual reviews are the expected time to ask. Come with market data and a clear case.' },
 { cat:'Income', icon:'briefcase', color:'#00D4AA', title:'Benefits are worth real money', body:'Pension matching, health insurance, cycle to work, and childcare vouchers have real monetary value. Factor them into total compensation when comparing jobs.' },
 { cat:'Income', icon:'briefcase', color:'#00D4AA', title:'Switching jobs often beats getting promoted', body:'External hires typically earn 15-20% more than internal promotions for the same role. Loyalty is admirable, but the market rewards movement.' },

 // Debt
 { cat:'Debt', icon:'trending-down', color:'#FF6B6B', title:'Pay highest-interest debt first', body:'The "avalanche" method - clearing highest APR debt first - saves the most money mathematically. Credit cards at 25% should come before personal loans at 6%.' },
 { cat:'Debt', icon:'trending-down', color:'#FF6B6B', title:'Student loan is not really a debt', body:'Plan 2 student loans are written off after 30 years and only repaid at 9% above £27,295. For lower earners, you may never repay it fully - treat it like a graduate tax.' },
 { cat:'Debt', icon:'trending-down', color:'#FF6B6B', title:'Never miss a minimum payment', body:'Missing a minimum payment triggers fees, damages your credit score, and can lead to default. Automate minimum payments to avoid this even if cash is tight.' },
 { cat:'Debt', icon:'trending-down', color:'#FF6B6B', title:'Overdrafts are expensive - avoid them', body:'Unarranged overdrafts can cost 40%+ APR. Even arranged overdrafts are expensive. Keep a small buffer in your current account and use a savings account for emergencies.' },
 { cat:'Debt', icon:'trending-down', color:'#FF6B6B', title:'Debt consolidation can help but watch the term', body:'Consolidating at a lower rate makes sense, but extending from 3 years to 7 years often means paying more overall. Check the total amount repayable.' },
 { cat:'Debt', icon:'trending-down', color:'#FF6B6B', title:'Free debt advice is always available', body:'StepChange and Citizens Advice offer free, non-judgemental debt advice. If debt feels overwhelming, speaking to them is always the right first step.' },

 // General
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Compound interest works both ways', body:'Compound interest grows your savings exponentially. But it also grows your debts exponentially. Understanding this is one of the most important financial concepts.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Inflation erodes cash sitting in current accounts', body:'At 3% inflation, £10,000 in a 0% account loses £300 of real value per year. Cash needs to earn at least the inflation rate just to stand still.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Insurance is not an investment', body:'Whole-of-life insurance products sold as investments typically return less than simple term insurance plus a cheap index fund. Separate protection from investment.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Net worth matters more than income', body:'A doctor earning £90k and spending £89k has lower net worth than a teacher earning £35k and investing £700/month. Income is what you earn; wealth is what you keep.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Financial stress affects everything', body:'Money problems are the leading cause of relationship breakdowns and a major driver of mental health issues. Addressing finances proactively is self-care.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Lifestyle inflation is the enemy of wealth', body:'Every time income rises, spending tends to rise with it. Consciously keeping expenses stable when income grows is how ordinary earners build extraordinary wealth.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Talking about money removes the taboo', body:'British culture avoids money conversations, but discussing salaries with colleagues, friends, and partners leads to better decisions and reduces exploitation.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Small fees matter at scale', body:'A bank charging £10/month in fees costs £1,200 over 10 years. Free alternatives exist for almost every financial product. Review what you\'re paying for.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'The best financial plan is the one you follow', body:'A perfect strategy you abandon beats a brilliant strategy you cannot stick to. Build systems that fit your actual behaviour, not your ideal self.' },
 { cat:'General', icon:'bulb', color:'#6C63FF', title:'Know your numbers', body:'Most people don\'t know their monthly income, expenses, or net worth off the top of their head. Knowing these three numbers is the foundation of financial control.' },
];

const CAT_COLORS: Record<string, string> = {
 Saving:'#00D4AA', Budgeting:'#6C63FF', Investing:'#FFD700',
 Credit:'#FF9F43', Tax:'#FF6B6B', Property:'#a89fff',
 Income:'#00D4AA', Debt:'#FF6B6B', General:'#6C63FF',
};

function getDailyIndex() {
 const day = Math.floor(Date.now() / 86400000);
 const seed = (day * 1664525 + 1013904223) & 0x7fffffff;
 return seed % TIPS.length;
}

type Props = { onUpgrade: () => void; isLocked: boolean };

export default function FinanceTips({ onUpgrade, isLocked }: Props) {
 const { theme: c } = useTheme();
 const [expanded, setExpanded] = useState(false);

 // Always the same tip for the whole day — no navigation
 const idx = getDailyIndex();
 const tip = TIPS[idx];
 const catColor = CAT_COLORS[tip.cat] || c.accent;

 if (isLocked) {
 return (
 <TouchableOpacity onPress={onUpgrade} activeOpacity={0.85}
 style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: c.border }}>
 <View style={{ flexDirection:'row', alignItems:'center', gap: 10, marginBottom: 10 }}>
 <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor:'#FFD70018', justifyContent:'center', alignItems:'center' }}>
 <Ionicons name="bulb" size={16} color="#FFD700" />
 </View>
 <Text style={{ color: c.text, fontSize: 14, fontWeight:'700', flex: 1 }}>Daily Finance Tips</Text>
 <View style={{ backgroundColor:'#FFD70020', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor:'#FFD70040', flexDirection:'row', alignItems:'center', gap: 4 }}>
 <Ionicons name="flash" size={10} color="#FFD700" />
 <Text style={{ color:'#FFD700', fontSize: 10, fontWeight:'700' }}>PRO</Text>
 </View>
 </View>
 <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
 100+ expert financial tips for 18-35s. Covering saving, investing, tax, credit and more - updated daily.
 </Text>
 <View style={{ backgroundColor: c.accent +'18', borderRadius: 12, padding: 12, flexDirection:'row', alignItems:'center', justifyContent:'center', gap: 8 }}>
 <Ionicons name="lock-closed" size={14} color={c.accent} />
 <Text style={{ color: c.accent, fontSize: 13, fontWeight:'700' }}>Unlock with Pro</Text>
 </View>
 </TouchableOpacity>
 );
 }

 return (
 <View style={{ marginBottom: 20 }}>
 <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow:'hidden' }}>

 {/* Header */}
 <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border, gap: 10 }}>
 <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: catColor +'20', justifyContent:'center', alignItems:'center' }}>
 <Ionicons name={tip.icon as any} size={16} color={catColor} />
 </View>
 <View style={{ flex: 1 }}>
 <Text style={{ color: c.muted, fontSize: 10, fontWeight:'700', letterSpacing: 1.2, textTransform:'uppercase' }}>Daily Tip</Text>
 </View>
 <View style={{ backgroundColor: catColor +'18', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: catColor +'33' }}>
 <Text style={{ color: catColor, fontSize: 10, fontWeight:'700' }}>{tip.cat}</Text>
 </View>
 </View>

 {/* Content */}
 <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.8} style={{ padding: 16 }}>
 <Text style={{ color: c.text, fontSize: 15, fontWeight:'700', lineHeight: 22, marginBottom: expanded ? 10 : 0 }}>
 {tip.title}
 </Text>
 {expanded && (
 <Text style={{ color: c.muted, fontSize: 14, lineHeight: 22 }}>{tip.body}</Text>
 )}
 <View style={{ flexDirection:'row', alignItems:'center', gap: 4, marginTop: 8 }}>
 <Text style={{ color: catColor, fontSize: 12, fontWeight:'600' }}>
 {expanded ? 'Show less' : 'Read more'}
 </Text>
 <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={catColor} />
 </View>
 </TouchableOpacity>

 {/* Footer — shows day info, no navigation */}
 <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.border }}>
 <Text style={{ color: c.muted, fontSize: 11, textAlign:'center' }}>
 New tip tomorrow
 </Text>
 </View>

 </View>
 </View>
 );
}