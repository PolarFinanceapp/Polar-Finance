import { usePlan } from '@/context/PlanContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, Share, Switch, Text, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import StarBackground from '../../components/StarBackground';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES, CurrencyKey, LanguageKey, LANGUAGES, useLocale } from '../../context/LocaleContext';
import { ThemeColors, themes, useTheme } from '../../context/ThemeContext';
import { useUserData } from '../../context/UserDataContext';
import { supabase } from '../../lib/supabase';

const LAST_UPDATED = '03 March 2026';

// ── Translated legal content ──────────────────────────────────────────────────
type LegalSection = { title: string; body: string };

const PRIVACY: Record<string, LegalSection[]> = {
  en: [
    { title: '1. Who We Are', body: 'James Finance is a personal finance application.\n\nGeneral: contact@jamesfinance.app\nData requests: privacy@jamesfinance.app' },
    { title: '2. What Data We Collect', body: '• Account data: email and encrypted password (Supabase Auth)\n• Financial data you manually enter: transactions, cards, bills, goals, assets, income sources\n• Receipt images: processed in real-time by Claude AI — not stored by us or Anthropic\n• Tax helper data: stored locally on your device only — never sent to our servers\n• Anonymised crash diagnostics (no financial data included)\n• Currency rates from exchangerate-api.com (no personal data sent)\n\nWe do not collect biometric data, location, or contact lists.' },
    { title: '3. How We Use Your Data', body: 'Your data is used solely to provide and improve the James Finance experience:\n\n• Displaying your financial summary, transactions, goals, and assets\n• Scanning receipts using AI to extract transaction details\n• Syncing your data across devices via Supabase\n• Calculating tax estimates locally on-device\n• Sending account emails (verification, password reset)\n\nWe never sell your data or use it for advertising.' },
    { title: '4. Data Storage & Security', body: '• All data in transit encrypted via TLS 1.2+\n• Data at rest encrypted via AES-256 (Supabase / AWS)\n• Row Level Security enforced — only you can access your data\n• Auth tokens stored in device secure enclave (iOS Keychain / Android Keystore)\n• All inputs sanitised client-side and server-side\n• Rate limiting applied to login, signup, and promo code attempts\n• Tax helper data stored locally via AsyncStorage and never transmitted' },
    { title: '5. Third-Party Services', body: '• Supabase — database & auth (AWS)\n• Anthropic (Claude AI) — receipt processing only; images not retained\n• ExchangeRate-API — currency rates; no personal data sent\n• Alpha Vantage — stock data (Premium)\n• Finnhub — trading signals (Premium)\n• CoinGecko — crypto prices (Premium)\n• Expo / React Native — app framework' },
    { title: '6. Tax Helper', body: 'The Tax Helper operates entirely on-device:\n\n• Estimates, calculations, and checklist progress stored locally\n• No tax data is sent to our servers or any third party\n• Data is scoped to your user ID to prevent cross-account leakage\n• Estimates are for guidance only — not financial or tax advice' },
    { title: '7. Bank Linking', body: 'Direct bank linking is not currently available. Cards and investments are added manually.\n\nWhen introduced, it will use a regulated Open Banking provider and you will be asked for explicit consent.' },
    { title: '8. Your Rights (UK GDPR)', body: 'Under UK GDPR you have the right to:\n\n• Access, correct, or delete your personal data\n• Port your data in machine-readable format\n• Object to or restrict certain processing\n• Lodge a complaint with the ICO (ico.org.uk)\n\nEmail: privacy@jamesfinance.app — we respond within 30 days.' },
    { title: '9. Data Retention', body: 'Data is kept while your account is active. On deletion, all personal and financial data is permanently removed within 30 days.\n\nLocally stored data is removed when you uninstall the app.' },
    { title: '10. Children', body: 'James Finance is not intended for anyone under 18. Contact us at contact@jamesfinance.app if you believe a minor has created an account.' },
    { title: '11. Changes', body: 'We may update this policy. The "Last Updated" date will change when we do. Continued use constitutes acceptance.' },
    { title: '12. Contact', body: 'Privacy: privacy@jamesfinance.app\nGeneral: contact@jamesfinance.app\nICO (UK): ico.org.uk' },
  ],
  es: [
    { title: '1. Quiénes Somos', body: 'James Finance es una aplicación de finanzas personales.\n\nGeneral: contact@jamesfinance.app\nSolicitudes de datos: privacy@jamesfinance.app' },
    { title: '2. Qué Datos Recopilamos', body: '• Datos de cuenta: correo y contraseña cifrada (Supabase Auth)\n• Datos financieros que introduces manualmente\n• Imágenes de recibos: procesadas en tiempo real por Claude AI — no se almacenan\n• Datos del asistente fiscal: solo en tu dispositivo, nunca enviados a nuestros servidores\n• Diagnósticos anónimos de fallos (sin datos financieros)\n\nNo recopilamos datos biométricos, ubicación ni listas de contactos.' },
    { title: '3. Cómo Usamos Tus Datos', body: 'Tus datos se usan únicamente para ofrecer y mejorar James Finance. Nunca vendemos tus datos ni los usamos para publicidad.' },
    { title: '4. Almacenamiento y Seguridad', body: '• Tráfico cifrado con TLS 1.2+\n• Datos en reposo cifrados con AES-256\n• Seguridad a nivel de fila (RLS) — solo tú accedes a tus datos\n• Tokens almacenados en el enclave seguro del dispositivo\n• Entradas saneadas para prevenir inyecciones\n• Limitación de intentos de inicio de sesión y códigos promocionales' },
    { title: '5. Servicios de Terceros', body: '• Supabase — base de datos y autenticación\n• Anthropic (Claude AI) — solo escaneo de recibos\n• ExchangeRate-API — tipos de cambio\n• Alpha Vantage, Finnhub, CoinGecko — datos de mercado (Premium)' },
    { title: '6. Asistente Fiscal', body: 'El asistente fiscal funciona completamente en el dispositivo. Ningún dato fiscal se envía a nuestros servidores. Las estimaciones son orientativas — no son asesoramiento fiscal.' },
    { title: '7. Vinculación Bancaria', body: 'La vinculación bancaria directa no está disponible actualmente. Cuando se introduzca, se solicitará tu consentimiento explícito.' },
    { title: '8. Tus Derechos (RGPD)', body: 'Tienes derecho a acceder, corregir, eliminar o portar tus datos. Email: privacy@jamesfinance.app — respondemos en 30 días.' },
    { title: '9. Retención de Datos', body: 'Los datos se conservan mientras tu cuenta esté activa. Al eliminarla, todos los datos se borran permanentemente en 30 días.' },
    { title: '10. Menores', body: 'James Finance no está destinado a menores de 18 años.' },
    { title: '11. Cambios', body: 'Podemos actualizar esta política. El uso continuado implica aceptación.' },
    { title: '12. Contacto', body: 'Privacidad: privacy@jamesfinance.app\nGeneral: contact@jamesfinance.app' },
  ],
  fr: [
    { title: '1. Qui Sommes-Nous', body: 'James Finance est une application de finances personnelles.\n\nContact: contact@jamesfinance.app\nDonnées: privacy@jamesfinance.app' },
    { title: '2. Données Collectées', body: '• Données de compte: email et mot de passe chiffré\n• Données financières saisies manuellement\n• Images de reçus: traitées par Claude AI — non stockées\n• Données fiscales: stockées localement uniquement\n• Diagnostics anonymisés de plantages\n\nNous ne collectons pas de données biométriques, de localisation ni de contacts.' },
    { title: '3. Utilisation des Données', body: 'Vos données sont utilisées uniquement pour fournir et améliorer James Finance. Nous ne vendons jamais vos données et ne les utilisons pas à des fins publicitaires.' },
    { title: '4. Stockage et Sécurité', body: '• Transit chiffré TLS 1.2+\n• Repos chiffré AES-256\n• Sécurité au niveau des lignes (RLS)\n• Tokens stockés dans l\'enclave sécurisée du dispositif\n• Entrées assainies contre les injections\n• Limitation du taux de tentatives de connexion' },
    { title: '5. Services Tiers', body: '• Supabase — base de données et auth\n• Anthropic (Claude AI) — scan de reçus uniquement\n• ExchangeRate-API — taux de change\n• Alpha Vantage, Finnhub, CoinGecko — données de marché (Premium)' },
    { title: '6. Assistant Fiscal', body: 'L\'assistant fiscal fonctionne entièrement sur votre appareil. Aucune donnée fiscale n\'est transmise. Les estimations sont indicatives — pas de conseil fiscal.' },
    { title: '7. Liaison Bancaire', body: 'La liaison bancaire directe n\'est pas disponible actuellement. Votre consentement explicite sera demandé lors de son introduction.' },
    { title: '8. Vos Droits (RGPD)', body: 'Vous avez le droit d\'accéder, corriger, supprimer ou porter vos données. Email: privacy@jamesfinance.app — réponse sous 30 jours.' },
    { title: '9. Conservation des Données', body: 'Les données sont conservées tant que votre compte est actif. À la suppression, toutes les données sont effacées sous 30 jours.' },
    { title: '10. Enfants', body: 'James Finance n\'est pas destiné aux moins de 18 ans.' },
    { title: '11. Modifications', body: 'Nous pouvons mettre à jour cette politique. L\'utilisation continue vaut acceptation.' },
    { title: '12. Contact', body: 'Confidentialité: privacy@jamesfinance.app\nGénéral: contact@jamesfinance.app' },
  ],
  de: [
    { title: '1. Wer Wir Sind', body: 'James Finance ist eine persönliche Finanz-App.\n\nKontakt: contact@jamesfinance.app\nDatenanfragen: privacy@jamesfinance.app' },
    { title: '2. Erhobene Daten', body: '• Kontodaten: E-Mail und verschlüsseltes Passwort\n• Von dir manuell eingegebene Finanzdaten\n• Belegbilder: von Claude AI verarbeitet — nicht gespeichert\n• Steuerhilfedaten: nur lokal auf deinem Gerät\n• Anonymisierte Absturzdiagnosen\n\nWir erheben keine biometrischen, Standort- oder Kontaktdaten.' },
    { title: '3. Datenverwendung', body: 'Deine Daten werden ausschließlich zur Bereitstellung und Verbesserung von James Finance genutzt. Wir verkaufen deine Daten nie und nutzen sie nicht für Werbung.' },
    { title: '4. Speicherung & Sicherheit', body: '• TLS 1.2+ Verschlüsselung im Transit\n• AES-256 Verschlüsselung im Ruhezustand\n• Row Level Security (RLS) — nur du hast Zugang\n• Tokens im sicheren Gerätespeicher (Keychain/Keystore)\n• Eingaben werden bereinigt und validiert\n• Rate-Limiting bei Login und Promo-Codes' },
    { title: '5. Drittanbieter', body: '• Supabase — Datenbank & Auth\n• Anthropic (Claude AI) — nur Belegscan\n• ExchangeRate-API — Wechselkurse\n• Alpha Vantage, Finnhub, CoinGecko — Marktdaten (Premium)' },
    { title: '6. Steuerhelfer', body: 'Der Steuerhelfer arbeitet vollständig auf deinem Gerät. Keine Steuerdaten werden übertragen. Schätzungen sind nur Orientierungswerte — keine Steuerberatung.' },
    { title: '7. Bankverknüpfung', body: 'Direkte Bankverknüpfung ist derzeit nicht verfügbar. Deine ausdrückliche Einwilligung wird bei Einführung eingeholt.' },
    { title: '8. Deine Rechte (DSGVO)', body: 'Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit. E-Mail: privacy@jamesfinance.app — Antwort innerhalb von 30 Tagen.' },
    { title: '9. Datenspeicherung', body: 'Daten werden gespeichert, solange dein Konto aktiv ist. Bei Löschung werden alle Daten innerhalb von 30 Tagen dauerhaft entfernt.' },
    { title: '10. Kinder', body: 'James Finance ist nicht für Personen unter 18 Jahren bestimmt.' },
    { title: '11. Änderungen', body: 'Wir können diese Richtlinie aktualisieren. Die weitere Nutzung gilt als Zustimmung.' },
    { title: '12. Kontakt', body: 'Datenschutz: privacy@jamesfinance.app\nAllgemein: contact@jamesfinance.app' },
  ],
  it: [
    { title: '1. Chi Siamo', body: 'James Finance è un\'applicazione di finanza personale.\n\nContatto: contact@jamesfinance.app\nRichieste dati: privacy@jamesfinance.app' },
    { title: '2. Dati Raccolti', body: '• Dati account: email e password cifrata\n• Dati finanziari inseriti manualmente\n• Immagini ricevute: elaborate da Claude AI — non archiviate\n• Dati fiscali: solo sul tuo dispositivo\n• Diagnostica anonima degli arresti anomali\n\nNon raccogliamo dati biometrici, posizione o contatti.' },
    { title: '3. Utilizzo dei Dati', body: 'I tuoi dati vengono utilizzati esclusivamente per fornire e migliorare James Finance. Non vendiamo mai i tuoi dati né li usiamo per pubblicità.' },
    { title: '4. Archiviazione e Sicurezza', body: '• Traffico cifrato con TLS 1.2+\n• Dati a riposo cifrati con AES-256\n• Row Level Security (RLS) — solo tu accedi ai tuoi dati\n• Token nel secure enclave del dispositivo\n• Input sanificati contro iniezioni\n• Limitazione tentativi di accesso e codici promo' },
    { title: '5. Servizi Terzi', body: '• Supabase — database e auth\n• Anthropic (Claude AI) — solo scansione ricevute\n• ExchangeRate-API — tassi di cambio\n• Alpha Vantage, Finnhub, CoinGecko — dati di mercato (Premium)' },
    { title: '6. Assistente Fiscale', body: 'L\'assistente fiscale funziona interamente sul dispositivo. Nessun dato fiscale viene trasmesso. Le stime sono indicative — non sono consulenza fiscale.' },
    { title: '7. Collegamento Bancario', body: 'Il collegamento bancario diretto non è attualmente disponibile. Il tuo consenso esplicito sarà richiesto quando verrà introdotto.' },
    { title: '8. I Tuoi Diritti (GDPR)', body: 'Hai il diritto di accedere, correggere, cancellare o portare i tuoi dati. Email: privacy@jamesfinance.app — risposta entro 30 giorni.' },
    { title: '9. Conservazione Dati', body: 'I dati vengono conservati finché il tuo account è attivo. Alla cancellazione, tutti i dati vengono rimossi permanentemente entro 30 giorni.' },
    { title: '10. Minori', body: 'James Finance non è destinato a persone di età inferiore ai 18 anni.' },
    { title: '11. Modifiche', body: 'Potremmo aggiornare questa policy. L\'uso continuato costituisce accettazione.' },
    { title: '12. Contatto', body: 'Privacy: privacy@jamesfinance.app\nGenerale: contact@jamesfinance.app' },
  ],
  pt: [
    { title: '1. Quem Somos', body: 'James Finance é um aplicativo de finanças pessoais.\n\nContato: contact@jamesfinance.app\nSolicitações de dados: privacy@jamesfinance.app' },
    { title: '2. Dados Coletados', body: '• Dados da conta: e-mail e senha criptografada\n• Dados financeiros inseridos manualmente\n• Imagens de recibos: processadas pelo Claude AI — não armazenadas\n• Dados fiscais: apenas no seu dispositivo\n• Diagnósticos anônimos de falhas\n\nNão coletamos dados biométricos, localização ou contatos.' },
    { title: '3. Uso dos Dados', body: 'Seus dados são usados exclusivamente para fornecer e melhorar o James Finance. Nunca vendemos seus dados nem os usamos para publicidade.' },
    { title: '4. Armazenamento e Segurança', body: '• Trânsito criptografado com TLS 1.2+\n• Dados em repouso criptografados com AES-256\n• Row Level Security (RLS) — apenas você acessa seus dados\n• Tokens armazenados no enclave seguro do dispositivo\n• Entradas sanitizadas contra injeções\n• Limitação de tentativas de login e códigos promocionais' },
    { title: '5. Serviços de Terceiros', body: '• Supabase — banco de dados e auth\n• Anthropic (Claude AI) — apenas digitalização de recibos\n• ExchangeRate-API — taxas de câmbio\n• Alpha Vantage, Finnhub, CoinGecko — dados de mercado (Premium)' },
    { title: '6. Assistente Fiscal', body: 'O Assistente Fiscal funciona inteiramente no dispositivo. Nenhum dado fiscal é transmitido. As estimativas são orientativas — não são consultoria fiscal.' },
    { title: '7. Vinculação Bancária', body: 'A vinculação bancária direta não está disponível no momento. Seu consentimento explícito será solicitado quando for introduzido.' },
    { title: '8. Seus Direitos (LGPD/GDPR)', body: 'Você tem o direito de acessar, corrigir, excluir ou portar seus dados. E-mail: privacy@jamesfinance.app — respondemos em 30 dias.' },
    { title: '9. Retenção de Dados', body: 'Os dados são mantidos enquanto sua conta estiver ativa. Na exclusão, todos os dados são removidos permanentemente em 30 dias.' },
    { title: '10. Menores', body: 'O James Finance não é destinado a menores de 18 anos.' },
    { title: '11. Alterações', body: 'Podemos atualizar esta política. O uso continuado constitui aceitação.' },
    { title: '12. Contato', body: 'Privacidade: privacy@jamesfinance.app\nGeral: contact@jamesfinance.app' },
  ],
  ar: [
    { title: '١. من نحن', body: 'James Finance هو تطبيق للتمويل الشخصي.\n\nالبريد: contact@jamesfinance.app\nطلبات البيانات: privacy@jamesfinance.app' },
    { title: '٢. البيانات التي نجمعها', body: '• بيانات الحساب: البريد الإلكتروني وكلمة المرور المشفرة\n• البيانات المالية التي تدخلها يدوياً\n• صور الإيصالات: تُعالج بواسطة Claude AI ولا تُخزَّن\n• بيانات المساعد الضريبي: محلية فقط على جهازك\n• تشخيصات مجهولة للأعطال\n\nلا نجمع بيانات بيومترية أو موقع أو قوائم اتصال.' },
    { title: '٣. كيف نستخدم بياناتك', body: 'تُستخدم بياناتك فقط لتوفير خدمة James Finance وتحسينها. نحن لا نبيع بياناتك ولا نستخدمها للإعلانات.' },
    { title: '٤. التخزين والأمان', body: '• تشفير البيانات أثناء النقل بـ TLS 1.2+\n• تشفير البيانات الساكنة بـ AES-256\n• أمان على مستوى الصفوف (RLS)\n• رموز المصادقة في المخزن الآمن للجهاز\n• تعقيم المدخلات لمنع الحقن\n• تحديد معدل محاولات تسجيل الدخول والرموز الترويجية' },
    { title: '٥. خدمات الطرف الثالث', body: '• Supabase — قاعدة البيانات والمصادقة\n• Anthropic (Claude AI) — مسح الإيصالات فقط\n• ExchangeRate-API — أسعار العملات\n• Alpha Vantage وFinnhub وCoinGecko — بيانات السوق (Premium)' },
    { title: '٦. المساعد الضريبي', body: 'يعمل المساعد الضريبي بالكامل على جهازك. لا تُرسل أي بيانات ضريبية. التقديرات للإرشاد فقط وليست استشارة ضريبية.' },
    { title: '٧. ربط البنك', body: 'الربط المباشر بالبنك غير متاح حالياً. سيُطلب موافقتك الصريحة عند إدخاله.' },
    { title: '٨. حقوقك', body: 'يحق لك الوصول إلى بياناتك وتصحيحها وحذفها ونقلها. البريد: privacy@jamesfinance.app — نرد خلال 30 يوماً.' },
    { title: '٩. الاحتفاظ بالبيانات', body: 'تُحفظ البيانات طالما حسابك نشط. عند الحذف، تُزال جميع البيانات نهائياً خلال 30 يوماً.' },
    { title: '١٠. الأطفال', body: 'James Finance ليس مخصصاً لمن هم دون 18 عاماً.' },
    { title: '١١. التغييرات', body: 'قد نحدّث هذه السياسة. الاستمرار في الاستخدام يعني القبول.' },
    { title: '١٢. تواصل معنا', body: 'الخصوصية: privacy@jamesfinance.app\nعام: contact@jamesfinance.app' },
  ],
  zh: [
    { title: '1. 关于我们', body: 'James Finance 是一款个人理财应用程序。\n\n联系方式：contact@jamesfinance.app\n数据请求：privacy@jamesfinance.app' },
    { title: '2. 我们收集的数据', body: '• 账户数据：电子邮件和加密密码\n• 您手动输入的财务数据\n• 收据图片：由 Claude AI 实时处理——不存储\n• 税务助手数据：仅存储在您的设备本地\n• 匿名崩溃诊断信息\n\n我们不收集生物特征、位置或联系人数据。' },
    { title: '3. 数据使用方式', body: '您的数据仅用于提供和改进 James Finance 服务。我们绝不出售您的数据，也不将其用于广告目的。' },
    { title: '4. 存储与安全', body: '• 传输中的数据通过 TLS 1.2+ 加密\n• 静态数据通过 AES-256 加密\n• 行级安全 (RLS) — 仅您可访问自己的数据\n• 身份验证令牌存储在设备安全区域\n• 所有输入经过清理以防止注入攻击\n• 登录和促销码尝试次数受限' },
    { title: '5. 第三方服务', body: '• Supabase — 数据库和身份验证\n• Anthropic (Claude AI) — 仅限收据扫描\n• ExchangeRate-API — 汇率\n• Alpha Vantage、Finnhub、CoinGecko — 市场数据（高级版）' },
    { title: '6. 税务助手', body: '税务助手完全在设备本地运行。不会向我们的服务器发送任何税务数据。估算结果仅供参考——不构成税务建议。' },
    { title: '7. 银行关联', body: '目前暂不支持直接银行关联。引入时将明确征求您的同意。' },
    { title: '8. 您的权利', body: '您有权访问、更正、删除或转移您的数据。邮箱：privacy@jamesfinance.app — 我们将在 30 天内回复。' },
    { title: '9. 数据保留', body: '数据在您的账户有效期内保留。删除账户后，所有数据将在 30 天内被永久删除。' },
    { title: '10. 未成年人', body: 'James Finance 不适用于 18 岁以下人士。' },
    { title: '11. 变更', body: '我们可能会更新本政策。继续使用即表示接受。' },
    { title: '12. 联系我们', body: '隐私：privacy@jamesfinance.app\n一般：contact@jamesfinance.app' },
  ],
  ja: [
    { title: '1. 運営者について', body: 'James Finance は個人向け財務管理アプリです。\n\n一般: contact@jamesfinance.app\nデータ請求: privacy@jamesfinance.app' },
    { title: '2. 収集するデータ', body: '• アカウントデータ：メールアドレスと暗号化パスワード\n• 手動入力した財務データ\n• レシート画像：Claude AI でリアルタイム処理 — 保存しない\n• 税務アシスタントデータ：デバイスローカルのみ\n• 匿名クラッシュ診断\n\n生体認証、位置情報、連絡先は収集しません。' },
    { title: '3. データの利用方法', body: 'データは James Finance の提供・改善のためにのみ使用します。販売や広告目的での利用は一切行いません。' },
    { title: '4. 保存とセキュリティ', body: '• 通信は TLS 1.2+ で暗号化\n• 保存データは AES-256 で暗号化\n• 行レベルセキュリティ (RLS) — 自分のデータのみアクセス可能\n• 認証トークンはデバイスのセキュアエンクレーブに保存\n• 入力はインジェクション対策のためサニタイズ\n• ログイン・プロモコードの試行回数を制限' },
    { title: '5. サードパーティサービス', body: '• Supabase — データベース・認証\n• Anthropic (Claude AI) — レシートスキャンのみ\n• ExchangeRate-API — 為替レート\n• Alpha Vantage・Finnhub・CoinGecko — 市場データ（Premium）' },
    { title: '6. 税務アシスタント', body: '税務アシスタントはすべてデバイス上で動作します。税務データはサーバーに送信されません。試算は参考値であり、税務アドバイスではありません。' },
    { title: '7. 銀行連携', body: '現時点では直接の銀行連携には対応していません。導入時には明示的な同意を求めます。' },
    { title: '8. お客様の権利', body: 'データへのアクセス・訂正・削除・移行の権利があります。メール: privacy@jamesfinance.app — 30日以内に対応します。' },
    { title: '9. データ保持', body: 'アカウントが有効な間データは保持されます。削除後30日以内にすべてのデータを完全削除します。' },
    { title: '10. 未成年者', body: 'James Finance は18歳未満を対象としていません。' },
    { title: '11. 変更', body: 'ポリシーを更新する場合があります。継続使用は同意とみなされます。' },
    { title: '12. お問い合わせ', body: 'プライバシー: privacy@jamesfinance.app\n一般: contact@jamesfinance.app' },
  ],
};

const TERMS: Record<string, LegalSection[]> = {
  en: [
    { title: '1. Acceptance', body: 'By using James Finance, you agree to these Terms of Service. If you do not agree, do not use the app.' },
    { title: '2. Not Financial or Tax Advice', body: 'Nothing in this app — including tax estimates, market signals, investment values, or spending summaries — constitutes financial, investment, legal, or tax advice.\n\nThe Tax Helper provides estimates for guidance only. Always consult a qualified professional. Capital is at risk.' },
    { title: '3. Account Responsibility', body: 'You are responsible for maintaining the confidentiality of your credentials and all activity under your account. We will never ask for your password via email or in-app messages.' },
    { title: '4. Acceptable Use', body: 'You agree not to:\n\n• Use the app unlawfully\n• Reverse engineer or decompile the app\n• Circumvent rate limits or security controls\n• Submit false or malicious data\n• Attempt to access another user\'s data' },
    { title: '5. Security', body: 'We implement TLS encryption, AES-256 at rest, secure token storage, rate limiting, and input validation. No system is completely secure — use James Finance at your own risk.\n\nReport vulnerabilities to: contact@jamesfinance.app' },
    { title: '6. Subscriptions & Payments', body: 'Paid plans are managed through the App Store or Google Play. Subscriptions auto-renew monthly unless cancelled 24 hours before the renewal date.\n\nRefunds are governed by the platform\'s policy. We do not store payment card information.' },
    { title: '7. Intellectual Property', body: 'All content, design, code, and branding are the intellectual property of James Finance. You may not reproduce or distribute any part without written permission.' },
    { title: '8. Limitation of Liability', body: 'We are not liable for financial losses, data loss, market data inaccuracies, tax estimate errors, or service interruptions.\n\nOur total liability shall not exceed the amount you paid in the 12 months preceding the claim.' },
    { title: '9. Changes', body: 'We reserve the right to modify or discontinue the app at any time. Continued use after changes constitutes acceptance.' },
    { title: '10. Governing Law', body: 'These terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of courts in England and Wales.' },
    { title: '11. Contact', body: 'contact@jamesfinance.app\n\nWe aim to respond within 5 business days.' },
  ],
  es: [
    { title: '1. Aceptación', body: 'Al usar James Finance, aceptas estos Términos de Servicio.' },
    { title: '2. Sin Asesoramiento Financiero ni Fiscal', body: 'Nada en esta app constituye asesoramiento financiero, de inversión, legal o fiscal. El asistente fiscal ofrece estimaciones orientativas. Consulta siempre a un profesional. El capital está en riesgo.' },
    { title: '3. Responsabilidad de la Cuenta', body: 'Eres responsable de mantener la confidencialidad de tus credenciales y de toda la actividad de tu cuenta. Nunca pediremos tu contraseña.' },
    { title: '4. Uso Aceptable', body: 'Aceptas no usar la app de forma ilegal, no hacer ingeniería inversa, no eludir controles de seguridad ni intentar acceder a datos de otros usuarios.' },
    { title: '5. Seguridad', body: 'Implementamos cifrado TLS, AES-256, almacenamiento seguro de tokens, limitación de intentos y validación de entradas. Informa vulnerabilidades a: contact@jamesfinance.app' },
    { title: '6. Suscripciones y Pagos', body: 'Los planes de pago se gestionan a través de App Store o Google Play. Las suscripciones se renuevan automáticamente cada mes a menos que se cancelen 24 horas antes.' },
    { title: '7. Propiedad Intelectual', body: 'Todo el contenido, diseño y código son propiedad intelectual de James Finance. No puedes reproducirlos sin permiso escrito.' },
    { title: '8. Limitación de Responsabilidad', body: 'No somos responsables de pérdidas financieras, pérdida de datos, inexactitudes en datos de mercado ni errores en estimaciones fiscales.' },
    { title: '9. Cambios', body: 'Podemos modificar o interrumpir la app en cualquier momento. El uso continuado implica aceptación.' },
    { title: '10. Ley Aplicable', body: 'Estos términos se rigen por las leyes de Inglaterra y Gales.' },
    { title: '11. Contacto', body: 'contact@jamesfinance.app' },
  ],
  fr: [
    { title: '1. Acceptation', body: 'En utilisant James Finance, vous acceptez ces Conditions d\'utilisation.' },
    { title: '2. Pas de Conseil Financier ou Fiscal', body: 'Rien dans cette app ne constitue un conseil financier, d\'investissement, juridique ou fiscal. L\'assistant fiscal fournit des estimations indicatives. Consultez toujours un professionnel qualifié. Le capital est à risque.' },
    { title: '3. Responsabilité du Compte', body: 'Vous êtes responsable de la confidentialité de vos identifiants et de toute activité sur votre compte. Nous ne demanderons jamais votre mot de passe.' },
    { title: '4. Utilisation Acceptable', body: 'Vous acceptez de ne pas utiliser l\'app illégalement, de ne pas la décompiler, de ne pas contourner les contrôles de sécurité, ni d\'accéder aux données d\'autres utilisateurs.' },
    { title: '5. Sécurité', body: 'Nous mettons en œuvre TLS, AES-256, stockage sécurisé des tokens, limitation du taux et validation des entrées. Signalez les vulnérabilités à: contact@jamesfinance.app' },
    { title: '6. Abonnements et Paiements', body: 'Les plans payants sont gérés via l\'App Store ou Google Play. Les abonnements se renouvellent automatiquement sauf annulation 24h avant.' },
    { title: '7. Propriété Intellectuelle', body: 'Tout le contenu, la conception et le code sont la propriété intellectuelle de James Finance. Reproduction interdite sans autorisation écrite.' },
    { title: '8. Limitation de Responsabilité', body: 'Nous ne sommes pas responsables des pertes financières, de la perte de données, des inexactitudes des données de marché ou des erreurs d\'estimation fiscale.' },
    { title: '9. Modifications', body: 'Nous nous réservons le droit de modifier l\'app. L\'utilisation continue vaut acceptation.' },
    { title: '10. Droit Applicable', body: 'Ces conditions sont régies par le droit anglais et gallois.' },
    { title: '11. Contact', body: 'contact@jamesfinance.app' },
  ],
  de: [
    { title: '1. Annahme', body: 'Mit der Nutzung von James Finance stimmst du diesen Nutzungsbedingungen zu.' },
    { title: '2. Kein Finanz- oder Steuerberatung', body: 'Nichts in dieser App stellt eine Finanz-, Anlage-, Rechts- oder Steuerberatung dar. Der Steuerhelfer liefert nur Schätzwerte. Konsultiere stets einen qualifizierten Fachmann. Kapitalverlust ist möglich.' },
    { title: '3. Kontoverantwortung', body: 'Du bist für die Vertraulichkeit deiner Zugangsdaten und alle Aktivitäten in deinem Konto verantwortlich. Wir fragen nie nach deinem Passwort.' },
    { title: '4. Zulässige Nutzung', body: 'Du stimmst zu, die App nicht rechtswidrig zu nutzen, sie nicht zu dekompilieren, keine Sicherheitskontrollen zu umgehen und nicht auf Daten anderer Nutzer zuzugreifen.' },
    { title: '5. Sicherheit', body: 'Wir implementieren TLS, AES-256, sichere Token-Speicherung, Rate-Limiting und Eingabevalidierung. Schwachstellen melden an: contact@jamesfinance.app' },
    { title: '6. Abonnements und Zahlungen', body: 'Kostenpflichtige Pläne werden über den App Store oder Google Play verwaltet. Abonnements verlängern sich automatisch, sofern sie nicht 24 Stunden vorher gekündigt werden.' },
    { title: '7. Geistiges Eigentum', body: 'Alle Inhalte, Designs und Code sind geistiges Eigentum von James Finance. Vervielfältigung ohne schriftliche Genehmigung ist untersagt.' },
    { title: '8. Haftungsbeschränkung', body: 'Wir haften nicht für finanzielle Verluste, Datenverluste, ungenaue Marktdaten oder Fehler bei Steuerschätzungen.' },
    { title: '9. Änderungen', body: 'Wir behalten uns das Recht vor, die App jederzeit zu ändern. Die weitere Nutzung gilt als Zustimmung.' },
    { title: '10. Anwendbares Recht', body: 'Diese Bedingungen unterliegen dem Recht von England und Wales.' },
    { title: '11. Kontakt', body: 'contact@jamesfinance.app' },
  ],
  it: [
    { title: '1. Accettazione', body: 'Utilizzando James Finance, accetti questi Termini di Servizio.' },
    { title: '2. Nessuna Consulenza Finanziaria o Fiscale', body: 'Nulla in questa app costituisce consulenza finanziaria, di investimento, legale o fiscale. L\'assistente fiscale fornisce stime indicative. Consulta sempre un professionista qualificato. Il capitale è a rischio.' },
    { title: '3. Responsabilità dell\'Account', body: 'Sei responsabile della riservatezza delle tue credenziali e di tutta l\'attività sul tuo account. Non chiederemo mai la tua password.' },
    { title: '4. Uso Accettabile', body: 'Accetti di non usare l\'app illegalmente, non decompilare, non aggirare i controlli di sicurezza né accedere ai dati di altri utenti.' },
    { title: '5. Sicurezza', body: 'Implementiamo TLS, AES-256, archiviazione sicura dei token, limitazione dei tentativi e validazione degli input. Segnala vulnerabilità a: contact@jamesfinance.app' },
    { title: '6. Abbonamenti e Pagamenti', body: 'I piani a pagamento sono gestiti tramite App Store o Google Play. Gli abbonamenti si rinnovano automaticamente salvo disdetta 24 ore prima.' },
    { title: '7. Proprietà Intellettuale', body: 'Tutti i contenuti, il design e il codice sono proprietà intellettuale di James Finance. La riproduzione senza autorizzazione scritta è vietata.' },
    { title: '8. Limitazione di Responsabilità', body: 'Non siamo responsabili per perdite finanziarie, perdita di dati, inesattezze nei dati di mercato o errori nelle stime fiscali.' },
    { title: '9. Modifiche', body: 'Ci riserviamo il diritto di modificare l\'app in qualsiasi momento. L\'uso continuato costituisce accettazione.' },
    { title: '10. Legge Applicabile', body: 'Questi termini sono regolati dalla legge di Inghilterra e Galles.' },
    { title: '11. Contatto', body: 'contact@jamesfinance.app' },
  ],
  pt: [
    { title: '1. Aceitação', body: 'Ao usar o James Finance, você concorda com estes Termos de Serviço.' },
    { title: '2. Sem Consultoria Financeira ou Fiscal', body: 'Nada neste app constitui consultoria financeira, de investimento, jurídica ou fiscal. O Assistente Fiscal fornece estimativas orientativas. Consulte sempre um profissional qualificado. O capital está em risco.' },
    { title: '3. Responsabilidade da Conta', body: 'Você é responsável pela confidencialidade de suas credenciais e por toda a atividade em sua conta. Nunca solicitaremos sua senha.' },
    { title: '4. Uso Aceitável', body: 'Você concorda em não usar o app ilegalmente, não fazer engenharia reversa, não contornar controles de segurança nem acessar dados de outros usuários.' },
    { title: '5. Segurança', body: 'Implementamos TLS, AES-256, armazenamento seguro de tokens, limitação de tentativas e validação de entradas. Reporte vulnerabilidades para: contact@jamesfinance.app' },
    { title: '6. Assinaturas e Pagamentos', body: 'Os planos pagos são gerenciados pela App Store ou Google Play. As assinaturas se renovam automaticamente, salvo cancelamento 24 horas antes.' },
    { title: '7. Propriedade Intelectual', body: 'Todo o conteúdo, design e código são propriedade intelectual do James Finance. A reprodução sem permissão escrita é proibida.' },
    { title: '8. Limitação de Responsabilidade', body: 'Não somos responsáveis por perdas financeiras, perda de dados, imprecisões em dados de mercado ou erros em estimativas fiscais.' },
    { title: '9. Alterações', body: 'Reservamo-nos o direito de modificar o app a qualquer momento. O uso continuado constitui aceitação.' },
    { title: '10. Lei Aplicável', body: 'Estes termos são regidos pelas leis da Inglaterra e do País de Gales.' },
    { title: '11. Contato', body: 'contact@jamesfinance.app' },
  ],
  ar: [
    { title: '١. القبول', body: 'باستخدامك James Finance، فإنك توافق على شروط الخدمة هذه.' },
    { title: '٢. لا استشارة مالية أو ضريبية', body: 'لا يُعدّ أي محتوى في هذا التطبيق — بما في ذلك التقديرات الضريبية وإشارات السوق — استشارة مالية أو استثمارية أو قانونية أو ضريبية. استشر دائماً متخصصاً مؤهلاً. رأس المال في خطر.' },
    { title: '٣. مسؤولية الحساب', body: 'أنت مسؤول عن سرية بيانات اعتمادك وجميع الأنشطة في حسابك. لن نطلب كلمة مرورك أبداً.' },
    { title: '٤. الاستخدام المقبول', body: 'توافق على عدم استخدام التطبيق بشكل غير قانوني، وعدم إجراء هندسة عكسية، وعدم التحايل على ضوابط الأمان، أو محاولة الوصول إلى بيانات مستخدمين آخرين.' },
    { title: '٥. الأمان', body: 'نطبق تشفير TLS وAES-256 وتخزين رموز آمنة وتحديد معدل المحاولات والتحقق من المدخلات. أبلغ عن الثغرات على: contact@jamesfinance.app' },
    { title: '٦. الاشتراكات والمدفوعات', body: 'تُدار الخطط المدفوعة عبر App Store أو Google Play. تُجدَّد الاشتراكات تلقائياً ما لم تُلغَ قبل 24 ساعة من تاريخ التجديد.' },
    { title: '٧. الملكية الفكرية', body: 'جميع المحتويات والتصميمات والأكواد هي ملكية فكرية لـ James Finance. لا يجوز نسخها أو توزيعها بدون إذن كتابي.' },
    { title: '٨. تحديد المسؤولية', body: 'لسنا مسؤولين عن الخسائر المالية أو فقدان البيانات أو أخطاء بيانات السوق أو أخطاء التقديرات الضريبية.' },
    { title: '٩. التغييرات', body: 'نحتفظ بحق تعديل التطبيق في أي وقت. الاستمرار في الاستخدام يعني القبول.' },
    { title: '١٠. القانون الحاكم', body: 'تخضع هذه الشروط لقوانين إنجلترا وويلز.' },
    { title: '١١. تواصل معنا', body: 'contact@jamesfinance.app' },
  ],
  zh: [
    { title: '1. 接受条款', body: '使用 James Finance 即表示您同意这些服务条款。' },
    { title: '2. 非财务或税务建议', body: '本应用中的任何内容——包括税务估算、市场信号、投资价值或支出摘要——均不构成财务、投资、法律或税务建议。税务助手仅提供参考性估算。请始终咨询专业人士。资本面临风险。' },
    { title: '3. 账户责任', body: '您有责任保管好您的账户凭据，并对账户下的所有活动负责。我们绝不会通过电子邮件或应用内消息索取您的密码。' },
    { title: '4. 可接受使用', body: '您同意不得：\n\n• 以非法目的使用本应用\n• 对应用进行逆向工程或反编译\n• 规避速率限制或安全控制\n• 提交虚假或恶意数据\n• 尝试访问其他用户的数据' },
    { title: '5. 安全性', body: '我们实施 TLS 加密、AES-256 静态加密、安全令牌存储、速率限制和输入验证。如发现安全漏洞，请报告至：contact@jamesfinance.app' },
    { title: '6. 订阅与付款', body: '付费套餐通过 App Store 或 Google Play 管理。除非在续订日期前 24 小时取消，否则订阅将自动续订。我们不存储支付卡信息。' },
    { title: '7. 知识产权', body: 'James Finance 的所有内容、设计和代码均为其知识产权。未经书面许可，不得复制或分发。' },
    { title: '8. 责任限制', body: '我们不对财务损失、数据丢失、市场数据不准确或税务估算错误承担责任。' },
    { title: '9. 变更', body: '我们保留随时修改或终止应用的权利。继续使用即表示接受变更。' },
    { title: '10. 适用法律', body: '这些条款受英格兰和威尔士法律管辖。' },
    { title: '11. 联系方式', body: 'contact@jamesfinance.app' },
  ],
  ja: [
    { title: '1. 同意', body: 'James Finance を使用することで、本利用規約に同意したものとみなされます。' },
    { title: '2. 財務・税務アドバイスではない', body: '本アプリのいかなる内容も——税務試算、市場シグナル、投資価値、支出サマリーを含む——財務、投資、法務、税務アドバイスを構成しません。税務アシスタントは参考値を提供するものです。必ず有資格の専門家に相談してください。元本に損失リスクがあります。' },
    { title: '3. アカウント責任', body: 'アカウントの認証情報の機密性とすべての活動に責任を負います。パスワードをメールやアプリ内メッセージで求めることはありません。' },
    { title: '4. 許容される使用', body: '以下を行わないことに同意します：\n\n• 違法目的での使用\n• リバースエンジニアリングや逆コンパイル\n• レート制限やセキュリティ制御の回避\n• 虚偽または悪意のあるデータの送信\n• 他のユーザーのデータへのアクセス試行' },
    { title: '5. セキュリティ', body: 'TLS暗号化、AES-256静的暗号化、セキュアトークン保存、レート制限、入力バリデーションを実装しています。脆弱性の報告先: contact@jamesfinance.app' },
    { title: '6. サブスクリプションと支払い', body: '有料プランはApp StoreまたはGoogle Play経由で管理されます。更新日の24時間前にキャンセルしない限り、サブスクリプションは自動更新されます。支払い情報は保存しません。' },
    { title: '7. 知的財産', body: 'すべてのコンテンツ、デザイン、コードはJames Financeの知的財産です。書面による許可なく複製・配布することはできません。' },
    { title: '8. 責任の制限', body: '財務上の損失、データ損失、市場データの不正確さ、税務試算の誤りについて責任を負いません。' },
    { title: '9. 変更', body: 'アプリをいつでも変更・終了する権利を留保します。継続使用は変更への同意とみなされます。' },
    { title: '10. 準拠法', body: '本規約はイングランドおよびウェールズの法律に準拠します。' },
    { title: '11. お問い合わせ', body: 'contact@jamesfinance.app' },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { themeKey, theme: c, setThemeKey } = useTheme();
  const { hasFeature, plan, trialDaysLeft } = usePlan();
  const { language, currency, setLanguage, setCurrency, convertPrice, t } = useLocale();
  const { transactions, cards } = useFinance();
  const { budgets, goals, incomeSources } = useUserData();
  const router = useRouter();
  const canUseThemes = hasFeature('themes');

  const [showPaywall, setShowPaywall] = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    budget: true, goals: true, tips: true, investments: true, bills: true, unusual: true, summary: true,
  });
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openPrivacy, setOpenPrivacy] = useState<number | null>(null);
  const [openTerms, setOpenTerms] = useState<number | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);
  const toggleNotif = (key: string, value: boolean) => setNotifs(prev => ({ ...prev, [key]: value }));

  // Pick translated legal content — fall back to English
  const privacySections = PRIVACY[language] ?? PRIVACY.en;
  const termsSections = TERMS[language] ?? TERMS.en;

  const notifSettings = [
    { key: 'budget', label: t('budgetAlerts') || 'Budget Alerts', icon: 'warning-outline' },
    { key: 'goals', label: t('savingGoals') || 'Goal Milestones', icon: 'flag-outline' },
    { key: 'tips', label: 'Savings Tips', icon: 'bulb-outline' },
    { key: 'investments', label: t('investments') || 'Investment Updates', icon: 'trending-up-outline' },
    { key: 'bills', label: 'Bill Reminders', icon: 'notifications-outline' },
    { key: 'unusual', label: 'Unusual Spending', icon: 'search-outline' },
    { key: 'summary', label: 'Monthly Summary', icon: 'bar-chart-outline' },
  ];

  const clearLocalData = async () => {
    try { await AsyncStorage.clear(); } catch { }
  };

  // ── CSV Export ───────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      if (transactions.length === 0) {
        Alert.alert('Nothing to Export', 'Add some transactions first.');
        return;
      }

      // ── Transactions CSV ─────────────────────────────────────────────────
      const txnHeader = 'Date,Name,Category,Amount,Type';
      const txnRows = transactions.map(tx => {
        const date = (tx as any).date || '';
        const name = `"${tx.name.replace(/"/g, '""')}"`;
        const cat = `"${tx.cat.replace(/"/g, '""')}"`;
        const amount = Math.abs(tx.amount).toFixed(2);
        const type = tx.type;
        return `${date},${name},${cat},${amount},${type}`;
      });
      const txnCSV = [txnHeader, ...txnRows].join('\n');

      // ── Budgets CSV ──────────────────────────────────────────────────────
      const budgetHeader = 'Category,Monthly Limit';
      const budgetRows = budgets.map(b => `"${b.cat}",${b.limit.toFixed(2)}`);
      const budgetCSV = [budgetHeader, ...budgetRows].join('\n');

      // ── Goals CSV ────────────────────────────────────────────────────────
      const goalHeader = 'Goal,Saved,Target';
      const goalRows = goals.map(g => `"${g.name}",${g.saved.toFixed(2)},${g.target.toFixed(2)}`);
      const goalCSV = [goalHeader, ...goalRows].join('\n');

      // ── Income CSV ───────────────────────────────────────────────────────
      const incomeHeader = 'Source,Amount,Frequency';
      const incomeRows = incomeSources.map(s => `"${s.label}",${s.amount.toFixed(2)},${s.frequency}`);
      const incomeCSV = [incomeHeader, ...incomeRows].join('\n');

      // ── Combine into one file ─────────────────────────────────────────────
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-');
      const fullCSV = [
        '=== JAMES FINANCE EXPORT ===',
        `Exported: ${now.toLocaleDateString('en-GB')}`,
        '',
        '--- TRANSACTIONS ---',
        txnCSV,
        '',
        '--- BUDGETS ---',
        budgetCSV,
        '',
        '--- SAVING GOALS ---',
        goalCSV,
        '',
        '--- INCOME SOURCES ---',
        incomeCSV,
      ].join('\n');

      const fileName = `james-finance-export-${dateStr}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, fullCSV, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Share.share({
        title: 'James Finance Export',
        message: fullCSV,
        url: Platform.OS === 'ios' ? fileUri : undefined,
      });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account', style: 'destructive',
          onPress: () => Alert.alert(
            'Final Confirmation',
            'All your data will be gone forever.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, Delete Everything', style: 'destructive',
                onPress: async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
                    await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                        'apikey': anonKey,
                      },
                    });
                    await clearLocalData();
                    await supabase.auth.signOut();
                  } catch {
                    Alert.alert('Error', 'Could not delete account. Please try again.');
                  }
                },
              },
            ]
          ),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t('logOut'), 'Are you sure you want to log out?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logOut'), style: 'destructive', onPress: async () => {
          try { await supabase.auth.signOut(); } catch { }
          await AsyncStorage.multiRemove([
            'onboarding_complete', 'user_plan', 'trial_start',
            'trial_prompt_seen', 'jf_user_name', 'profile_photo', 'profile_avatar',
          ]);
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const handleRateApp = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review'
      : 'https://play.google.com/store/apps/details?id=com.jamesfinance.app';
    Linking.openURL(url).catch(() => Alert.alert('Coming Soon', 'Available once the app launches on the store.'));
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:contact@jamesfinance.app?subject=James Finance Feedback')
      .catch(() => Alert.alert('Feedback', 'Send your thoughts to contact@jamesfinance.app'));
  };

  const planLabel = plan === 'free' ? t('freePlan') : plan === 'trial' ? t('trialPlan') : plan === 'pro' ? t('proPlan') : t('premiumPlan');


  const Row = ({ icon, iconColor, iconBg, label, sub, onPress, right, noBorder }: {
    icon: string; iconColor?: string; iconBg?: string; label: string; sub?: string;
    onPress?: () => void; right?: React.ReactNode; noBorder?: boolean;
  }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: noBorder ? 0 : 1, borderBottomColor: c.border, gap: 14 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg || c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon as any} size={18} color={iconColor || c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
        {sub && <Text style={{ color: iconColor && iconColor !== c.accent ? iconColor : c.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={c.muted} />)}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>{t('settings')}</Text>

        {/* ── Your Plan ── */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('yourPlan')}</Text>
        <TouchableOpacity
          onPress={() => (plan === 'free' || plan === 'trial' || plan === 'expired') ? setShowPaywall(true) : null}
          style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: plan === 'free' || plan === 'expired' ? c.accent + '55' : '#00D4AA44', flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={plan === 'premium' ? 'diamond' : plan === 'trial' ? 'star' : plan === 'pro' ? 'flash' : 'person'} size={24} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>
              {planLabel}{plan === 'trial' && trialDaysLeft > 0 ? ` · ${trialDaysLeft}d left` : ''}
            </Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
              {(plan === 'free' || plan === 'trial' || plan === 'expired') ? t('tapToUpgrade') : t('allFeaturesUnlocked')}
            </Text>
          </View>
          {(plan === 'free' || plan === 'trial' || plan === 'expired') && <Ionicons name="chevron-forward" size={18} color={c.accent} />}
        </TouchableOpacity>

        {/* ── Theme ── */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('theme')}</Text>
        {canUseThemes ? (
          <TouchableOpacity
            style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 }}
            onPress={() => setShowThemePicker(true)}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="color-palette" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{themes[themeKey].name}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{themes[themeKey].description}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4, marginRight: 6 }}>
              {[c.accent, c.accent2, c.dark].map((col, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col }} />)}
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowPaywall(true)}
            style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="lock-closed" size={18} color={c.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.muted, fontSize: 14, fontWeight: '700' }}>{t('themesLocked')}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('upgradeProThemes')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.accent} />
          </TouchableOpacity>
        )}

        {/* ── General ── */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('general')}</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>

          {/* Notifications */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 14 }}
            onPress={() => toggle('notifs')}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="notifications" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t('notifications')}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('budgetAlerts')}</Text>
            </View>
            <Ionicons name={openSection === 'notifs' ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
          </TouchableOpacity>
          {openSection === 'notifs' && (
            <View style={{ backgroundColor: c.card2 }}>
              {notifSettings.map((n, i) => (
                <View key={n.key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingLeft: 20, borderBottomWidth: i < notifSettings.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 12 }}>
                  <Ionicons name={n.icon as any} size={16} color={c.muted} />
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{n.label}</Text>
                  <Switch value={notifs[n.key]} onValueChange={v => toggleNotif(n.key, v)} trackColor={{ false: c.card, true: c.accent }} thumbColor={notifs[n.key] ? '#fff' : c.muted} />
                </View>
              ))}
            </View>
          )}

          {/* Privacy Policy */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 14 }}
            onPress={() => toggle('privacy')}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="document-text" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t('privacyPolicy')}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{LAST_UPDATED}</Text>
            </View>
            <Ionicons name={openSection === 'privacy' ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
          </TouchableOpacity>
          {openSection === 'privacy' && (
            <View style={{ backgroundColor: c.card2, padding: 16 }}>
              {privacySections.map((s, i) => (
                <TouchableOpacity key={i}
                  style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}
                  onPress={() => setOpenPrivacy(openPrivacy === i ? null : i)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                    <Ionicons name={openPrivacy === i ? 'chevron-up' : 'chevron-down'} size={14} color={c.muted} />
                  </View>
                  {openPrivacy === i && (
                    <View style={{ padding: 12, paddingTop: 0 }}>
                      <Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Terms of Service */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 14 }}
            onPress={() => toggle('terms')}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="reader" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t('termsOfService')}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{LAST_UPDATED}</Text>
            </View>
            <Ionicons name={openSection === 'terms' ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
          </TouchableOpacity>
          {openSection === 'terms' && (
            <View style={{ backgroundColor: c.card2, padding: 16 }}>
              {termsSections.map((s, i) => (
                <TouchableOpacity key={i}
                  style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}
                  onPress={() => setOpenTerms(openTerms === i ? null : i)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                    <Ionicons name={openTerms === i ? 'chevron-up' : 'chevron-down'} size={14} color={c.muted} />
                  </View>
                  {openTerms === i && (
                    <View style={{ padding: 12, paddingTop: 0 }}>
                      <Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Row icon="cash" label={t('currency')} sub={`${CURRENCIES[currency].flag} ${CURRENCIES[currency].name}`} onPress={() => setShowCurrencyPicker(true)} />
          <Row icon="shield-checkmark" label={t('privacySecurity')} sub="Face ID, passcode & permissions" onPress={() => Linking.openSettings()} />
          <Row icon="cloud" label={t('backupSync')} sub="Auto-synced via Supabase"
            onPress={() => Alert.alert(t('backupSync'), 'Your data is automatically backed up to our secure cloud.', [{ text: 'OK' }])}
            right={
              <View style={{ backgroundColor: '#00D4AA22', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#00D4AA44' }}>
                <Text style={{ color: '#00D4AA', fontSize: 10, fontWeight: '700' }}>✓ Active</Text>
              </View>
            }
          />
          <Row icon="download-outline" label="Export Data" sub={`Export ${transactions.length} transactions as CSV`} onPress={handleExportCSV} />
          <Row icon="language" label={t('language')} sub={`${LANGUAGES[language].flag} ${LANGUAGES[language].nativeName}`} onPress={() => setShowLanguagePicker(true)} noBorder />
        </View>

        {/* ── About ── */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('about')}</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <Row icon="phone-portrait-outline" label={t('version')} sub="1.0.0 (Beta)" />
          <Row icon="star" label={t('rateApp')} sub={t('leaveReview')} onPress={handleRateApp} />
          <Row icon="chatbubble" label={t('feedback')} sub="contact@jamesfinance.app" onPress={handleFeedback} />
          <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com/jamesfinance.app?igsh=bGZpY241ZWlkbGVr').catch(() => { })}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E1306C18', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="logo-instagram" size={18} color="#E1306C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Instagram</Text>
              <Text style={{ color: '#E1306C', fontSize: 12, marginTop: 2, fontWeight: '600' }}>@jamesfinance.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.tiktok.com/@jamesfinance.app?_r=1&_t=ZN-94NjuWv6IvW').catch(() => { })}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#69C9D018', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="logo-tiktok" size={18} color="#69C9D0" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>TikTok</Text>
              <Text style={{ color: '#69C9D0', fontSize: 12, marginTop: 2, fontWeight: '600' }}>@jamesfinance.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://x.com/jamesfinanceapp').catch(() => { })}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="logo-twitter" size={18} color={c.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>X</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2, fontWeight: '600' }}>@jamesfinanceapp</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </TouchableOpacity>
        </View>

        {/* ── Disclaimer ── */}
        <View style={{ backgroundColor: '#FFD70018', borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFD70044', flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Ionicons name="warning" size={18} color="#FFD700" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>{t('financialDisclaimer')}</Text>
            <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t('financialDisclaimerDesc')}</Text>
          </View>
        </View>

        {/* ── Log Out ── */}
        <TouchableOpacity
          style={{ backgroundColor: '#FF6B6B18', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B44', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 10 }}
          onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color="#FF6B6B" />
          <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '800' }}>{t('logOut')}</Text>
        </TouchableOpacity>

        {/* ── Delete Account ── */}
        <TouchableOpacity
          style={{ backgroundColor: '#FF6B6B08', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B33', marginBottom: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={16} color="#FF6B6B99" />
          <Text style={{ color: '#FF6B6B99', fontSize: 13, fontWeight: '700' }}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ color: c.muted, fontSize: 12 }}>James Finance v1.0.0 (Beta)</Text>
          <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>© 2026 James Finance.</Text>
        </View>

        {/* ── Theme Picker ── */}
        <Modal visible={showThemePicker} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('chooseTheme')}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {(Object.entries(themes) as [string, ThemeColors][]).map(([key, th]) => {
                  const isActive = themeKey === key;
                  return (
                    <TouchableOpacity key={key}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: isActive ? th.accent + '22' : c.card2, borderWidth: 1, borderColor: isActive ? th.accent : c.border }}
                      onPress={() => { setThemeKey(key); setShowThemePicker(false); }}>
                      <Ionicons name="color-palette" size={24} color={th.accent} style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{th.name}</Text>
                        <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{th.description}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4, marginRight: 8 }}>
                        {[th.accent, th.accent2, th.dark].map((col, i) => <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: col }} />)}
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={20} color={th.accent} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowThemePicker(false)}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Language Picker ── */}
        <Modal visible={showLanguagePicker} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('chooseLanguage')}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {(Object.entries(LANGUAGES) as [LanguageKey, any][]).map(([key, lang]) => (
                  <TouchableOpacity key={key}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: language === key ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: language === key ? c.accent : c.border }}
                    onPress={() => { setLanguage(key); setShowLanguagePicker(false); }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{lang.nativeName}</Text>
                      <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{lang.name}</Text>
                    </View>
                    {language === key && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowLanguagePicker(false)}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Currency Picker ── */}
        <Modal visible={showCurrencyPicker} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('chooseCurrency')}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {(Object.entries(CURRENCIES) as [CurrencyKey, any][]).map(([key, curr]) => (
                  <TouchableOpacity key={key}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: currency === key ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: currency === key ? c.accent : c.border }}
                    onPress={() => { setCurrency(key); setShowCurrencyPicker(false); }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{curr.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{curr.name}</Text>
                      <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{key} · {curr.symbol}</Text>
                    </View>
                    {currency === key && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowCurrencyPicker(false)}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </ScrollView>
    </View>
  );
}