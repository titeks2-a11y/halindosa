import Link from "next/link";
import { AlertTriangle, HelpCircle, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { getSupportMailto, supportEmail } from "@/lib/support";

const supportCards = [
  {
    title: "가격·품절·링크 신고",
    description: "가격, 재고, 쿠폰 조건, 판매처 링크가 다를 때 알려주세요.",
    href: "/reports?reason=link_error",
    icon: AlertTriangle,
    label: "신고 접수하기"
  },
  {
    title: "구매 전 확인 기준",
    description: "최종 결제 금액, 배송비, 쿠폰, 취소·반품 조건은 판매처에서 한 번 더 확인합니다.",
    href: "/guide",
    icon: ShieldCheck,
    label: "서비스 안내 보기"
  },
  {
    title: "이메일 문의",
    description: "앱 이용, 제휴, 데이터 삭제 요청은 고객 지원 메일로 접수합니다.",
    href: getSupportMailto("할인도사 고객센터 문의"),
    icon: Mail,
    label: supportEmail
  }
];

const faqs = [
  {
    question: "할인도사에서 직접 결제하나요?",
    answer: "아니요. 할인도사는 특가 정보를 정리해 보여주고, 구매와 결제는 외부 판매처에서 진행됩니다."
  },
  {
    question: "가격이 다르게 보이면 어떻게 하나요?",
    answer: "쿠폰, 배송지, 재고, 판매처 정책에 따라 최종 가격이 달라질 수 있습니다. 상품 화면의 신고 기능으로 알려주시면 운영 검토에 반영합니다."
  },
  {
    question: "로그인 없이 사용할 수 있나요?",
    answer: "네. 홈, 검색, 카테고리, 상세, 찜, 알림, 마이 화면은 비회원도 확인할 수 있습니다. 로그인하면 찜과 최근 본 상품을 계정 기준으로 이어볼 수 있습니다."
  },
  {
    question: "내 데이터는 어디에서 관리하나요?",
    answer: "마이 화면에서 기기 저장 데이터, 분석 및 제휴 동의, 개인정보처리방침과 이용약관을 확인할 수 있습니다."
  }
];

export default function SupportPage() {
  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm lg:rounded-[28px] lg:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <MessageSquareText size={24} />
          </span>
          <div>
            <p className="text-xl font-black text-slate-950">고객센터</p>
            <p className="text-sm font-bold text-slate-500">특가 정보 확인, 신고, 정책 안내를 한곳에서 확인하세요.</p>
          </div>
        </div>
        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
        할인도사는 판매자가 아니며 상품 결제와 배송을 직접 처리하지 않습니다. 다만 잘못된 가격, 품절, 종료, 링크 오류는 빠르게 신고할 수 있게 정리해 특가 정보 품질을 관리합니다.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {supportCards.map((card) => {
          const Icon = card.icon;
          const isMail = card.href.startsWith("mailto:");

          const content = (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                <Icon size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-slate-950">{card.title}</span>
                <span className="mt-1 block text-sm font-semibold leading-6 text-slate-500">{card.description}</span>
                <span className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white">{card.label}</span>
              </span>
            </>
          );

          return isMail ? (
            <a key={card.title} href={card.href} className="flex gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-100 hover:bg-red-50">
              {content}
            </a>
          ) : (
            <Link key={card.title} href={card.href} className="flex gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-100 hover:bg-red-50">
              {content}
            </Link>
          );
        })}
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-dossa-red" />
          <h2 className="text-base font-black text-slate-950">자주 묻는 질문</h2>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {faqs.map((faq) => (
            <article key={faq.question} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-black text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">정책과 데이터 관리</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link href="/privacy" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-red-50 hover:text-dossa-red">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-red-50 hover:text-dossa-red">
            이용약관
          </Link>
          <Link href="/mypage" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-red-50 hover:text-dossa-red">
            마이 설정
          </Link>
        </div>
      </section>
    </div>
  );
}
