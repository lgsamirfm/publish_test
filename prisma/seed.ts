import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin user ──────────────────────────────────────────
  let admin = await prisma.user.findFirst({
    where: { phone: "09120000000" },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "مدیر بافخانه",
        phone: "09120000000",
        email: "admin@bafkhaneh.ir",
        password: hashPassword("admin123"),
        role: "ADMIN",
      },
    });
  }
  console.log(`  ✅ Admin: ${admin.phone} (password: admin123)`);

  // ── Demo customer ───────────────────────────────────────
  let customer = await prisma.user.findFirst({
    where: { phone: "09121234567" },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        name: "مشتری تست",
        phone: "09121234567",
        email: "customer@test.com",
        password: hashPassword("test123"),
        role: "CUSTOMER",
        address: "تهران، خیابان ولیعصر",
      },
    });
  }
  console.log(`  ✅ Customer: ${customer.phone} (password: test123)`);

  // ── Products ────────────────────────────────────────────
  const products = [
    {
      name: "عروسک خرگوش",
      description: "عروسک خرگوش آمیگورومی دست‌بافت با نخ پنبه ضد حساسیت. مناسب برای تزئین اتاق کودک و هدیه. ارتفاع حدود ۲۰ سانتی‌متر.",
      price: 350000,
      images: "/images/product-bunny.png",
      category: "عروسک و آمیگورومی",
      stock: 15,
      featured: true,
    },
    {
      name: "عروسک خرس",
      description: "عروسک خرس قهوه‌ای کروشه‌شده با نخ پنبه نرم. جنس ضد حساسیت و مناسب کودکان. ارتفاع حدود ۲۵ سانتی‌متر.",
      price: 400000,
      images: "/images/product-bear.png",
      category: "عروسک و آمیگورومی",
      stock: 10,
      featured: true,
    },
    {
      name: "عروسک گوزن",
      description: "عروسک گوزن شیرین با شاخ‌های طلایی. بافت ریز و ظریف با نخ پنبه مرغوب. ارتفاع حدود ۲۲ سانتی‌متر.",
      price: 380000,
      images: "/images/product-deer.png",
      category: "عروسک و آمیگورومی",
      stock: 8,
      featured: false,
    },
    {
      name: "عروسک گربه",
      description: "عروسک گربه ناز با چشم‌های درشت و دم بلند. کروشه دستی با نخ پنبه رنگارنگ. ارتفاع حدود ۱۸ سانتی‌متر.",
      price: 320000,
      images: "/images/product-cat.png",
      category: "عروسک و آمیگورومی",
      stock: 12,
      featured: false,
    },
    {
      name: "عروسک گل رز",
      description: "عروسک گل رز کروشه‌شده در رنگ‌های مختلف. مناسب برای تزئین و هدیه. قطر حدود ۱۲ سانتی‌متر.",
      price: 150000,
      images: "/images/product-rose.png",
      category: "گل کروشه",
      stock: 25,
      featured: true,
    },
    {
      name: "عروسک گلدانی",
      description: "عروسک آمیگورومی گلدانی با گل‌های کروشه‌شده. ترکیب هنر کروشه و گل‌آرایی. ارتفاع حدود ۲۰ سانتی‌متر.",
      price: 280000,
      images: "/images/product-plantpot.png",
      category: "گل کروشه",
      stock: 6,
      featured: false,
    },
    {
      name: "باجه گل عروسی",
      description: "باجه گل کروشه مخصوص عروسی با گل‌های سفید و کرم. شامل ۷ شاخه گل و برگ‌های سبز. طول حدود ۳۰ سانتی‌متر.",
      price: 650000,
      images: "/images/product-bouquet.png",
      category: "باجه گل",
      stock: 5,
      featured: true,
    },
    {
      name: "کلیدچین قلب",
      description: "کلیدچین قلب کروشه‌شده با نخ پنبه قرمز. مناسب هدیه ولنتاین و یادبود. طول حدود ۸ سانتی‌متر.",
      price: 80000,
      images: "/images/product-heart-keychain.png",
      category: "کلیدچین",
      stock: 30,
      featured: false,
    },
    {
      name: "کلیدچین ستاره",
      description: "کلیدچین ستاره کروشه‌شده با نخ پنبه زرد. شکلک بامزه و رنگارنگ. طول حدود ۷ سانتی‌متر.",
      price: 75000,
      images: "/images/product-star-keychain.png",
      category: "کلیدچین",
      stock: 20,
      featured: false,
    },
    {
      name: "کلیدچین گل",
      description: "کلیدچین گل کروشه‌شده در رنگ‌های متنوع. ظریف و زیبا برای زینت کلید. طول حدود ۶ سانتی‌متر.",
      price: 70000,
      images: "/images/product-flower-keychain.png",
      category: "کلیدچین",
      stock: 25,
      featured: false,
    },
    {
      name: "شال گردن کروشه",
      description: "شال گردن کروشه‌شده با نخ پنبه نرم و گرم. مناسب فصل پاییز و زمستان. طول حدود ۱۵۰ سانتی‌متر.",
      price: 450000,
      images: "/images/product-scarf.png",
      category: "لوازم تزئینی",
      stock: 7,
      featured: false,
    },
    {
      name: "کلاه کروشه",
      description: "کلاه کروشه‌شده با نخ پنبه ضخیم. طرح مدرن و رنگ‌بندی شاد. سایز یکسان قابل تنظیم.",
      price: 280000,
      images: "/images/product-hat.png",
      category: "لوازم تزئینی",
      stock: 10,
      featured: false,
    },
    {
      name: "دستکش کروشه",
      description: "دستکش کروشه‌شده با نخ پنبه گرم. مناسب استفاده روزمره در زمستان. سایز آزاد.",
      price: 200000,
      images: "/images/product-mittens.png",
      category: "لوازم تزئینی",
      stock: 12,
      featured: false,
    },
    {
      name: "پتو کروشه",
      description: "پتو کروشه‌شده با نخ پنبه نرم و ضخیم. مناسب نوزاد و کودک. ابعاد ۸۰×۸۰ سانتی‌متر.",
      price: 850000,
      images: "/images/product-blanket.png",
      category: "لوازم تزئینی",
      stock: 3,
      featured: true,
    },
    {
      name: "جوراب کروشه",
      description: "جوراب کروشه‌شده با نخ پنبه گرم و نرم. مناسب استفاده خانگی. سایز آزاد.",
      price: 180000,
      images: "/images/product-socks.png",
      category: "لوازم تزئینی",
      stock: 15,
      featured: false,
    },
    {
      name: "سویشرت کروشه",
      description: "سویشرت کروشه‌شده با نخ پنبه مرغوب. طرح کلاسیک و راحت. سایز M و L.",
      price: 750000,
      images: "/images/product-sweater.png",
      category: "لوازم تزئینی",
      stock: 4,
      featured: false,
    },
    {
      name: "کلاف نخ پنبه",
      description: "کلاف نخ پنبه رنگارنگ باکیفیت. مناسب کروشه و قلاب‌بافی. وزن ۱۰۰ گرم.",
      price: 95000,
      images: "/images/product-yarn.png",
      category: "لوازم تزئینی",
      stock: 50,
      featured: false,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }
  console.log(`  ✅ ${products.length} products checked/created`);

  // ── Patterns ────────────────────────────────────────────
  const patterns = [
    {
      title: "الگوی عروسک خرگوش",
      description: "الگوی کامل کروشه عروسک خرگوش آمیگورومی با توضیحات گام‌به‌گام و عکس. مناسب سطح متوسط. شامل راهنمای نخ و قلاب.",
      price: 80000,
      images: "/images/pattern-bunny.png",
      difficulty: "متوسط",
      yarnType: "نخ پنبه نازک (سوزنی ۲)",
      needleSize: "قلاب ۲.۵ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۲۰ خونه",
      featured: true,
    },
    {
      title: "الگوی عروسک خرس",
      description: "الگوی کروشه عروسک خرس با جزئیات کامل. مناسب سطح مبتدی تا متوسط. با عکس هر مرحله.",
      price: 85000,
      images: "/images/pattern-bear.png",
      difficulty: "مبتدی",
      yarnType: "نخ پنبه متوسط (سوزنی ۳)",
      needleSize: "قلاب ۳ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۱۸ خونه",
      featured: true,
    },
    {
      title: "الگوی عروسک گربه",
      description: "الگوی کروشه عروسک گربه ناز. سطح متوسط با جزئیات ظریف. شامل الگوی بدن، سر، دم و گوش.",
      price: 75000,
      images: "/images/pattern-cat.png",
      difficulty: "متوسط",
      yarnType: "نخ پنبه نازک (سوزنی ۲)",
      needleSize: "قلاب ۲.۵ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۲۰ خونه",
      featured: false,
    },
    {
      title: "الگوی گل رز",
      description: "الگوی کروشه گل رز واقع‌گرایانه. مناسب مبتدی. شامل گلبرگ، کاسبرگ و ساقه.",
      price: 45000,
      images: "/images/pattern-rose.png",
      difficulty: "مبتدی",
      yarnType: "نخ پنبه نازک",
      needleSize: "قلاب ۲ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۲۲ خونه",
      featured: true,
    },
    {
      title: "الگوی باجه گل",
      description: "الگوی کروشه باجه گل عروسی با چند نوع گل. سطح پیشرفته. شامل گل رز، مریم و برگ.",
      price: 120000,
      images: "/images/pattern-bouquet.png",
      difficulty: "پیشرفته",
      yarnType: "نخ پنبه نازک و متوسط",
      needleSize: "قلاب ۲ و ۳ میلی‌متر",
      gauge: "متفاوت بر اساس گل",
      featured: true,
    },
    {
      title: "الگوی قلب",
      description: "الگوی کروشه قلب ساده و زیبا. مناسب مبتدی. می‌توان به عنوان کلیدچین استفاده کرد.",
      price: 35000,
      images: "/images/pattern-heart.png",
      difficulty: "مبتدی",
      yarnType: "نخ پنبه متوسط",
      needleSize: "قلاب ۳ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۱۸ خونه",
      featured: false,
    },
    {
      title: "الگوی پولک‌دار (Cable)",
      description: "الگوی کروشه پولک‌دار کلاسیک. مناسب شال و پتو. سطح متوسط به بالا.",
      price: 65000,
      images: "/images/pattern-cable.png",
      difficulty: "پیشرفته",
      yarnType: "نخ پنبه ضخیم (سوزنی ۴)",
      needleSize: "قلاب ۴ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۱۴ خونه",
      featured: false,
    },
    {
      title: "الگوی دنده‌ای (Ribbed)",
      description: "الگوی کروشه دنده‌ای ساده و کشسان. مناسب کلاه و دستکش. سطح مبتدی.",
      price: 40000,
      images: "/images/pattern-ribbed.png",
      difficulty: "مبتدی",
      yarnType: "نخ پنبه متوسط",
      needleSize: "قلاب ۳.۵ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۱۶ خونه",
      featured: false,
    },
    {
      title: "الگوی تور (Lace)",
      description: "الگوی کروشه تور ظریف و زیبا. مناسب رومیز و راهپله. سطح پیشرفته.",
      price: 95000,
      images: "/images/pattern-lace.png",
      difficulty: "پیشرفته",
      yarnType: "نخ پنبه نازک",
      needleSize: "قلاب ۱.۵ میلی‌متر",
      gauge: "۱۰×۱۰ سانتی‌متر = ۲۴ خونه",
      featured: false,
    },
  ];

  for (const p of patterns) {
    const existing = await prisma.pattern.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.pattern.create({ data: p });
    }
  }
  console.log(`  ✅ ${patterns.length} patterns checked/created`);

  console.log("\n🎉 Seeding complete!");
  console.log("─────────────────────────────────");
  console.log("Admin login:    09120000000 / admin123");
  console.log("Customer login: 09121234567 / test123");
  console.log("─────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });