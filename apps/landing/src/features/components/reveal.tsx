import { type HTMLMotionProps, motion, useReducedMotion } from 'motion/react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};

interface RevealSectionProps extends HTMLMotionProps<'section'> {
  /** true이면 whileInView 대신 즉시 재생 (Hero용) */
  immediate?: boolean;
}

export function RevealSection({
  immediate = false,
  children,
  ...props
}: RevealSectionProps) {
  const reducedMotion = useReducedMotion();
  const skip = reducedMotion === true;

  return (
    <motion.section
      variants={containerVariants}
      initial={skip ? 'visible' : 'hidden'}
      {...(immediate
        ? { animate: 'visible' }
        : { whileInView: 'visible', viewport: { once: true, amount: 0.15 } })}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function RevealItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}
